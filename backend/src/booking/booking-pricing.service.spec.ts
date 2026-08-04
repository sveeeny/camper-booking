import { BadRequestException } from '@nestjs/common';
import { SettingsService } from '@/settings/settings.service';
import { BookingPricingService } from './booking-pricing.service';

describe('BookingPricingService', () => {
  const settingsService = {
    getSettings: jest.fn(),
  };
  const service = new BookingPricingService(
    settingsService as unknown as SettingsService,
  );

  beforeEach(() => {
    settingsService.getSettings.mockResolvedValue({
      pricePerNightPerCar: 26,
      adultTax: 4,
      childTax: 4,
      maxGuestsPerCar: 6,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('calculates the authoritative vehicle and person prices', async () => {
    const result = await service.calculate('2026-08-10', '2026-08-13', [
      {
        carPlate: 'UR 1234',
        checkInDate: '2026-08-10',
        checkOutDate: '2026-08-13',
        isCancelled: false,
        adults: 2,
        children: 1,
      },
      {
        carPlate: 'ZH 9876',
        checkInDate: '2026-08-10',
        checkOutDate: '2026-08-13',
        isCancelled: false,
        adults: 1,
        children: 2,
      },
    ]);

    expect(result).toMatchObject({
      nights: 3,
      basePrice: 156,
      personSurcharge: 72,
      totalPrice: 228,
    });
    expect(result.cars).toEqual([
      expect.objectContaining({ basePrice: 78, personSurcharge: 36 }),
      expect.objectContaining({ basePrice: 78, personSurcharge: 36 }),
    ]);
  });

  it('keeps adult and child rates independently configurable', async () => {
    settingsService.getSettings.mockResolvedValue({
      pricePerNightPerCar: 26,
      adultTax: 5,
      childTax: 2,
      maxGuestsPerCar: 6,
    });

    const result = await service.calculate('2026-08-10', '2026-08-12', [
      {
        carPlate: 'UR 1234',
        checkInDate: '2026-08-10',
        checkOutDate: '2026-08-12',
        isCancelled: false,
        adults: 2,
        children: 1,
      },
    ]);

    expect(result.personSurcharge).toBe(24);
    expect(result.totalPrice).toBe(76);
  });

  it('rejects more guests than the configured vehicle limit', async () => {
    await expect(
      service.calculate('2026-08-10', '2026-08-11', [
        {
          carPlate: 'UR 1234',
          checkInDate: '2026-08-10',
          checkOutDate: '2026-08-11',
          isCancelled: false,
          adults: 4,
          children: 3,
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
