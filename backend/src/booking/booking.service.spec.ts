import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from '@/availability/availability.service';
import { Availability } from '@/entities/availability.entity';
import { Booking } from '@/entities/booking.entity';
import { Car } from '@/entities/cars.entity';
import { StripeService } from '@/stripe/stripe.service';
import { Repository } from 'typeorm';
import { BookingDatesService } from './booking-dates.service';
import { BookingService } from './booking.service';
import { BookingPricingService } from './booking-pricing.service';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;

  const bookingFindOne = jest.fn();
  const bookingSave = jest.fn();
  const reserveBookingDates = jest.fn();
  const updateCarEntries = jest.fn();
  const calculatePricing = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback: unknown) => fallback,
          },
        },
        {
          provide: AvailabilityService,
          useValue: {},
        },
        {
          provide: StripeService,
          useValue: {
            verifyPayment: jest.fn(),
            sessionStillActive: jest.fn(),
            completePaidBooking: jest.fn(),
          },
        },
        {
          provide: BookingDatesService,
          useValue: {
            reserveBookingDates,
            updateCarEntries,
          },
        },
        {
          provide: BookingPricingService,
          useValue: {
            calculate: calculatePricing,
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: bookingFindOne,
            save: bookingSave,
          },
        },
        {
          provide: getRepositoryToken(Car),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(BookingService);
    bookingRepository = module.get(getRepositoryToken(Booking));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save guest data and delegate car updates', async () => {
    const dto = {
      bookingId: 'booking-1',
      salutation: 'Herr',
      firstName: 'Max',
      lastName: 'Mustermann',
      nationality: 'CH',
      phoneCountryCode: '+41',
      phoneNumber: '799999999',
      email: 'test@example.com',
      checkInDate: '2025-06-01',
      checkOutDate: '2025-06-03',
      cars: [
        {
          carPlate: 'UR 1234',
          checkInDate: '2025-06-01',
          checkOutDate: '2025-06-03',
          isCancelled: false,
          adults: 2,
          children: 1,
        },
      ],
      source: 'guest' as const,
    };
    const booking = {
      booking_id: dto.bookingId,
      numberOfCars: 1,
      cars: [
        {
          isCancelled: false,
          checkInDate: dto.checkInDate,
          checkOutDate: dto.checkOutDate,
        },
      ],
    } as Booking;
    const pricedCars = [
      {
        ...dto.cars[0],
        basePrice: 52,
        personSurcharge: 24,
      },
    ];
    bookingFindOne.mockResolvedValue(booking);
    bookingSave.mockResolvedValue(booking);
    calculatePricing.mockResolvedValue({
      nights: 2,
      basePrice: 52,
      personSurcharge: 24,
      totalPrice: 76,
      cars: pricedCars,
    });

    await expect(service.createBooking(dto)).resolves.toEqual({
      message: 'Buchung erfolgreich gespeichert!',
      bookingId: dto.bookingId,
      pricing: {
        basePrice: 52,
        personSurcharge: 24,
        totalPrice: 76,
      },
    });
    expect(bookingSave).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        firstName: dto.firstName,
        totalPrice: 76,
      }),
    );
    expect(updateCarEntries).toHaveBeenCalledWith(
      dto.bookingId,
      dto.checkInDate,
      dto.checkOutDate,
      pricedCars,
    );
  });

  it('returns the stored booking price in rappen for Stripe', async () => {
    bookingFindOne.mockResolvedValue({
      booking_id: 'booking-1',
      totalPrice: 76.25,
    } as Booking);

    await expect(service.getCheckoutAmountInRappen('booking-1')).resolves.toBe(
      7625,
    );
  });

  it('should return the reservation result from BookingDatesService', async () => {
    const unavailable = {
      success: false,
      message: 'Stellplätze wurden zwischenzeitlich belegt.',
    };
    reserveBookingDates.mockResolvedValue(unavailable);

    await expect(
      service.checkAvailability('2025-06-01', '2025-06-02', 2),
    ).resolves.toEqual(unavailable);
  });
});
