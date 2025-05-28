import * as puppeteer from 'puppeteer';
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
  const html = renderHtml(booking, settings);

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
  return Buffer.from(pdfBuffer); // ✅ wichtig
}

function renderHtml(booking: BookingPdfInput, settings: Settings): string {
  const carsHtml = booking.cars
    .map(
      (car, i) => `
      <div style="border:1px solid #ddd; border-radius:6px; padding:12px; margin-bottom:12px;">
        <strong>Fahrzeug ${i + 1}</strong><br>
        KFZ-Nr: ${car.carPlate}<br>
        Erwachsene: ${car.adults}<br>
        Kinder: ${car.children}
      </div>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8" />
      <title>Buchungsbestätigung</title>
      <style>
        body {
          font-family: sans-serif;
          padding: 24px;
          color: #333;
        }
        h1 {
          text-align: center;
          margin-bottom: 24px;
        }
        .section {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }
        .card {
          flex: 1;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 16px;
          background: #f9f9f9;
        }
        .card p {
          margin: 4px 0;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Buchungsbestätigung</h1>

      <div class="section">
        <div class="card">
          <strong>Zeitraum</strong>
          <p>Check-in: ${booking.checkIn} ab ${settings.checkInTime} Uhr</p>
          <p>Check-out: ${booking.checkOut} bis ${settings.checkOutTime} Uhr</p>
          <p>Anzahl Fahrzeuge: ${booking.cars.length}</p>
          <hr>
          <strong>Preisberechnung</strong>
          <p>Grundpreis: ${booking.priceBase} CHF</p>
          <p>Kurtaxe: ${booking.priceTax} CHF</p>
          <p><strong>Total: ${booking.priceTotal} CHF</strong></p>
        </div>

        <div class="card">
          <strong>Gästeinformationen</strong>
          <p>Anrede: ${booking.guest.salutation}</p>
          <p>Name: ${booking.guest.firstName} ${booking.guest.lastName}</p>
          <p>Nationalität: ${booking.guest.nationality}</p>
          <p>E-Mail: ${booking.guest.email}</p>
          <p>Telefon: ${booking.guest.phoneCountryCode} ${booking.guest.phoneNumber}</p>
        </div>
      </div>

      <div>
        ${carsHtml}
      </div>

      <div class="footer">
        Danke für deine Buchung bei Camper Herger!
      </div>
    </body>
    </html>
  `;
}
