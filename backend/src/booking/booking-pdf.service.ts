import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Settings } from '@/entities/settings.entity';
import { BookingPdfInput } from '@/types/pdf.types';

export async function generateBookingPDF(
  booking: BookingPdfInput,
  settings: Settings
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/chromium',
  });

  const page = await browser.newPage();
  const templatePath = path.resolve(__dirname, 'pdf-template.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  const carsHtml = booking.cars
    .map(
      (car, i) => `
      <div style="border:1px solid #ddd; border-radius:6px; padding:12px; margin-bottom:12px;">
        <strong>Fahrzeug ${i + 1}</strong><br>
        KFZ-Nr: ${car.carPlate}<br>
        Erwachsene: ${car.adults}<br>
        Kinder: ${car.children}<br>
        Grundpreis: ${car.priceBase.toFixed(2)} CHF<br>
        Kurtaxe: ${car.priceTax.toFixed(2)} CHF
      </div>`
    )
    .join('');

  // Platzhalter ersetzen
  html = html
    .replace('{{SALUTATION}}', booking.guest.salutation)
    .replace('{{FIRST_NAME}}', booking.guest.firstName)
    .replace('{{LAST_NAME}}', booking.guest.lastName)
    .replace('{{NATIONALITY}}', booking.guest.nationality)
    .replace('{{EMAIL}}', booking.guest.email)
    .replace('{{PHONE}}', booking.guest.phoneCountryCode + ' ' + booking.guest.phoneNumber)
    .replace('{{CHECKIN_DATE}}', booking.checkIn)
    .replace('{{CHECKOUT_DATE}}', booking.checkOut)
    .replace('{{CHECKIN_TIME}}', settings.checkInTime)
    .replace('{{CHECKOUT_TIME}}', settings.checkOutTime)
    .replace('{{CAR_COUNT}}', booking.cars.length.toString())
    .replace('{{TOTAL_PRICE}}', booking.priceTotal.toFixed(2))
    .replace('{{CARS_HTML}}', carsHtml);

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
