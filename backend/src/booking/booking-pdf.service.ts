import { Settings } from '@/entities/settings.entity';
import { BookingPdfInput } from '@/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

export async function generateBookingPDF(
  booking: BookingPdfInput,
  settings: Settings,
  language: string,
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const lang = language === 'de' ? 'de' : 'en';
    const templatePath = path.resolve(
      __dirname,
      `templates/pdf-template.${lang}.html`,
    );
    let html = fs.readFileSync(templatePath, 'utf-8');
    const carsHtml = booking.cars
      .map(
        (car, index) => `
          <div style="border:1px solid #ddd; border-radius:6px; padding:12px; margin-bottom:12px;">
            <strong>Fahrzeug ${index + 1}</strong><br>
            KFZ-Nr: ${escapeHtml(car.carPlate)}<br>
            Erwachsene: ${car.adults}<br>
            Kinder: ${car.children}<br>
            Grundpreis: ${car.priceBase.toFixed(2)} CHF<br>
            Kurtaxe: ${car.priceTax.toFixed(2)} CHF
          </div>`,
      )
      .join('');

    html = html
      .replace('{{SALUTATION}}', escapeHtml(booking.guest.salutation))
      .replace('{{FIRST_NAME}}', escapeHtml(booking.guest.firstName))
      .replace('{{LAST_NAME}}', escapeHtml(booking.guest.lastName))
      .replace('{{NATIONALITY}}', escapeHtml(booking.guest.nationality))
      .replace('{{EMAIL}}', escapeHtml(booking.guest.email))
      .replace(
        '{{PHONE}}',
        `${escapeHtml(booking.guest.phoneCountryCode)} ${escapeHtml(booking.guest.phoneNumber)}`,
      )
      .replace('{{CHECKIN_DATE}}', escapeHtml(booking.checkIn))
      .replace('{{CHECKOUT_DATE}}', escapeHtml(booking.checkOut))
      .replace('{{CHECKIN_TIME}}', escapeHtml(settings.checkInTime))
      .replace('{{CHECKOUT_TIME}}', escapeHtml(settings.checkOutTime))
      .replace('{{CAR_COUNT}}', booking.cars.length.toString())
      .replace('{{TOTAL_PRICE}}', booking.priceTotal.toFixed(2))
      .replace('{{CARS_HTML}}', carsHtml);

    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
