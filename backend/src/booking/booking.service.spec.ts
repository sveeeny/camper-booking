// src/booking/booking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '@/entities/booking.entity';
import { Car } from '@/entities/cars.entity';
import { AvailabilityService } from '@/availability/availability.service';
import { Repository } from 'typeorm';
import { Availability } from '@/entities/availability.entity';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: jest.Mocked<Repository<Booking>>;
  let carRepo: jest.Mocked<Repository<Car>>;
  let availabilityRepo: jest.Mocked<Repository<Availability>>;
  let availabilityService: AvailabilityService;

  const saveMock = jest.fn();
  const findOneMock = jest.fn();
  const isAvailableMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        AvailabilityService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'MAX_BOOKING_FUTURE_DAYS') return 540;
              if (key === 'TABLE_CREATION_THRESHOLD_DAYS') return 365;
              return null;
            },
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: findOneMock,
            save: saveMock,
          },
        },
        {
          provide: getRepositoryToken(Car),
          useValue: {
            findOne: findOneMock,
            save: saveMock,
          },
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepo = module.get(getRepositoryToken(Booking));
    carRepo = module.get(getRepositoryToken(Car));
    availabilityService = module.get(AvailabilityService);

    // Optional: zentrale Mocks wie .isAvailable() mocken
    availabilityService.isAvailable = isAvailableMock;
  });

  afterEach(() => {
    jest.clearAllMocks(); // sauberes Zurücksetzen nach jedem Test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Beispiel-Test: createBooking
  it('should update a booking and cars', async () => {
    const dto = {
      bookingId: 1,
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
      cars: [
        {
          carPlate: 'ZH123',
          isCancelled: false,
          adults: 2,
          children: 0,
          touristTax: 6,
          checkInDate: '2025-06-01',
          checkOutDate: '2025-06-02',
        },
      ],
    };

    const mockBooking = { booking_id: 1 };
    const mockCar = {};

    findOneMock.mockResolvedValueOnce(mockBooking as any); // find booking
    findOneMock.mockResolvedValueOnce(mockCar as any);     // find car
    saveMock.mockResolvedValueOnce(mockBooking as any);
    saveMock.mockResolvedValueOnce({});

    const result = await service.createBooking(dto as any);

    expect(result).toEqual({ message: 'Buchung erfolgreich gespeichert!', bookingId: 1 });
    expect(findOneMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
  });

  // Beispiel-Test: checkAvailability
  it('should return false if no availability', async () => {
    isAvailableMock.mockResolvedValue(false);
    const result = await service.checkAvailability('2025-06-01', '2025-06-02', 2);
    expect(result).toEqual({ success: false, message: 'Stellplätze wurden zwischenzeitlich belegt.' });
  });
});
