import { Settings } from '@/entities/settings.entity';
import { BookingPdfInput } from '@/types/pdf.types';
import { generateBookingPDF } from './booking-pdf.service';

describe('generateBookingPDF', () => {
  const booking: BookingPdfInput = {
    id: 'booking-pdf-test',
    checkIn: '12.08.2026',
    checkOut: '15.08.2026',
    status: 'paid',
    spot: null,
    guestName: 'Max Mustermann',
    guest: {
      salutation: 'Herr',
      firstName: 'Max',
      lastName: 'Mustermann',
      nationality: 'Schweiz',
      email: 'max.mustermann@example.com',
      phoneCountryCode: '+41',
      phoneNumber: '79 123 45 67',
    },
    cars: [
      {
        carPlate: 'TG 123456',
        adults: 2,
        children: 0,
        priceBase: 50,
        priceTax: 12,
      },
      {
        carPlate: 'ZH 482991',
        adults: 3,
        children: 1,
        priceBase: 50,
        priceTax: 18,
      },
      {
        carPlate: 'BE 771204',
        adults: 1,
        children: 0,
        priceBase: 50,
        priceTax: 6,
      },
      {
        carPlate: 'LU 908317',
        adults: 2,
        children: 2,
        priceBase: 50,
        priceTax: 15,
      },
      {
        carPlate: 'SG 554802',
        adults: 2,
        children: 1,
        priceBase: 50,
        priceTax: 9,
      },
    ],
    priceTotal: 310,
  };

  const settings = Object.assign(new Settings(), {
    checkInTime: '14:00',
    checkOutTime: '11:00',
  });

  it.each(['de', 'en'])('creates a valid %s PDF buffer', async (language) => {
    const pdf = await generateBookingPDF(booking, settings, language);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5_000);
  });
});
