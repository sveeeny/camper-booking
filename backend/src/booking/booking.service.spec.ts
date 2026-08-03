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

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;

  const bookingFindOne = jest.fn();
  const bookingSave = jest.fn();
  const reserveBookingDates = jest.fn();
  const updateCarEntries = jest.fn();

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
      totalPrice: 100,
      checkInDate: '2025-06-01',
      checkOutDate: '2025-06-03',
      cars: [],
      source: 'guest' as const,
    };
    const booking = { booking_id: dto.bookingId } as Booking;
    bookingFindOne.mockResolvedValue(booking);
    bookingSave.mockResolvedValue(booking);

    await expect(service.createBooking(dto)).resolves.toEqual({
      message: 'Buchung erfolgreich gespeichert!',
      bookingId: dto.bookingId,
    });
    expect(bookingRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        firstName: dto.firstName,
      }),
    );
    expect(updateCarEntries).toHaveBeenCalledWith(
      dto.bookingId,
      dto.checkInDate,
      dto.checkOutDate,
      dto.cars,
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
