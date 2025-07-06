import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { ConfigService } from '@nestjs/config';
import { AvailabilityService } from '../availability/availability.service';
import { Booking } from '../entities/booking.entity';
import { Car } from '../entities/cars.entity';
import { Availability } from '../entities/availability.entity';
import { BookingDatesService } from './booking-dates.service';
import { Between } from 'typeorm';
import { eachDayOfInterval, subDays, format } from 'date-fns'; // sicherstellen, dass @types/date-fns NICHT installiert ist
import { LessThan, LessThanOrEqual, MoreThan } from 'typeorm';
import { BookingSource } from '../entities/booking.entity';
import { StripeService } from '@/stripe/stripe.service';
import { cleanupTimers } from './booking-timers';
import { Logger } from '@nestjs/common';

const logger = new Logger('BookingCleanup');



function toBookingSource(value: string | undefined): BookingSource {
  if (!value || value === 'guest') return BookingSource.GUEST;
  if (value === 'host') return BookingSource.HOST;
  throw new BadRequestException(`Ungültiger source-Wert: ${value}`);
}

@Injectable()
export class BookingService {
  private maxBookingFutureDays: number;
  private tableCreationThresholdDays: number;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,

    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,

    private readonly configService: ConfigService,
    private readonly availabilityService: AvailabilityService,
    private readonly stripeService: StripeService,

    private readonly bookingDatesService: BookingDatesService,
  ) {
    this.maxBookingFutureDays = this.configService.get<number>('MAX_BOOKING_FUTURE_DAYS', 540);
    this.tableCreationThresholdDays = this.configService.get<number>('TABLE_CREATION_THRESHOLD_DAYS', 365);
  }

  resetTimer(bookingId: string): void {
    if (cleanupTimers.has(bookingId)) {
      const existingTimeout = cleanupTimers.get(bookingId);
      clearTimeout(existingTimeout);
      cleanupTimers.delete(bookingId);
    }

    this.scheduleBookingCleanup(bookingId);
    console.log(`🔁 Timer für Buchung ${bookingId} wurde zurückgesetzt.`);
  }


  async scheduleBookingCleanup(bookingId: string): Promise<void> {
    // ⛔️ Timer bereits aktiv? → Nichts tun
    if (cleanupTimers.has(bookingId)) {
      logger.debug(`⏳ Cleanup-Timer für Buchung ${bookingId} ist bereits aktiv. Kein neuer Timer gesetzt.`);
      return;
    }

    logger.log(`🕐 Starte Cleanup-Timer für Buchung ${bookingId} (in 1 Minute)`);

    const timeout = setTimeout(async () => {
      try {
        logger.log(`⏰ Cleanup-Timer ausgelöst für Buchung ${bookingId}. Prüfung beginnt...`);

        const booking = await this.bookingRepository.findOne({
          where: { booking_id: bookingId },
        });

        if (!booking) {
          logger.warn(`⚠️ Buchung ${bookingId} existiert nicht mehr. Timer wird entfernt.`);
          cleanupTimers.delete(bookingId);
          return;
        }

        if (booking.status === 'paid' || booking.status === 'cash') {
          logger.log(`✅ Buchung ${bookingId} ist bereits abgeschlossen (${booking.status}). Kein Cleanup nötig.`);
          cleanupTimers.delete(bookingId);
          return;
        }

        if (booking.status === 'pending') {
          logger.log(`🔄 Buchung ${bookingId} ist pending. Stripe-Zahlung wird überprüft...`);
          const isPaid = await this.stripeService.verifyPayment(bookingId);

          if (isPaid) {
            await this.updateStatus(bookingId, 'paid');
            logger.log(`✅ Stripe-Zahlung bestätigt. Buchung ${bookingId} wurde auf paid gesetzt.`);
            cleanupTimers.delete(bookingId);
            return;
          } else {
            logger.warn(`❌ Keine Stripe-Zahlung für Buchung ${bookingId} gefunden. Buchung wird gelöscht.`);
          }
        } else {
          logger.warn(`❌ Buchung ${bookingId} hat Status "${booking.status}" und wird gelöscht.`);
        }

        await this.deleteBooking(bookingId);
        logger.log(`🗑️ Buchung ${bookingId} erfolgreich gelöscht.`);
        cleanupTimers.delete(bookingId);
      } catch (err) {
        logger.error(`❌ Fehler beim Cleanup von Buchung ${bookingId}: ${err.message}`, err.stack);
        cleanupTimers.delete(bookingId);
      }
    }, 5 * 60 * 1000); // ⏳ 5 Minuten

    cleanupTimers.set(bookingId, timeout);
  }

  // cronJob
  async getOutdatedDraftsAndPending(cutoff: Date) {
    return this.bookingRepository.find({
      where: [
        { status: 'draft', createdAt: LessThan(cutoff) },
        { status: 'pending', createdAt: LessThan(cutoff) },
      ],
    });
  }


  //Neue checkAvailability
  async checkAvailability(checkInDate: string, checkOutDate: string, numberOfCars: number) {
    const result = await this.bookingDatesService.reserveBookingDates(
      checkInDate,
      checkOutDate,
      numberOfCars
    );

    // ⏱️ Cleanup nur bei erfolgreicher Buchung starten
    if (result.success && result.bookingId) {
      await this.scheduleBookingCleanup(result.bookingId);
      console.log(`🕐 Cleanup-Timer für Buchung ${result.bookingId} gestartet.`);

    }

    return result;
  }



  //Neue createBooking
  async createBooking(dto: CreateBookingGuestDto): Promise<any> {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Buchung nicht gefunden');
    }



    // ➕ Gästeinfos speichern
    booking.salutation = dto.salutation;
    booking.firstName = dto.firstName;
    booking.lastName = dto.lastName;
    booking.nationality = dto.nationality;
    booking.phoneCountryCode = dto.phoneCountryCode;
    booking.phoneNumber = dto.phoneNumber;
    booking.email = dto.email;
    booking.totalPrice = dto.totalPrice;
    booking.source = toBookingSource(dto.source ?? 'guest');


    await this.bookingRepository.save(booking);

    // ➕ Fahrzeugeinträge aktualisieren (→ ausgelagert)
    await this.bookingDatesService.updateCarEntries(
      dto.bookingId,
      dto.checkInDate,
      dto.checkOutDate,
      dto.cars,
    );

    return { message: 'Buchung erfolgreich gespeichert!', bookingId: booking.booking_id };
  }



  // HARD DELETE
  async deleteBooking(bookingId: string): Promise<{ message: string }> {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: bookingId },
      relations: ['cars'],
    });

    if (!booking) {
      throw new NotFoundException(`Buchung ${bookingId} nicht gefunden.`);
    }

    const numberOfCars = booking.numberOfCars;
    const checkIn = booking.cars[0]?.checkInDate;
    const checkOut = booking.cars[0]?.checkOutDate;

    if (!checkIn || !checkOut) {
      throw new Error('Check-in/out-Daten nicht vorhanden.');
    }

    const nights = eachDayOfInterval({
      start: new Date(checkIn),
      end: subDays(new Date(checkOut), 1),
    });

    for (const date of nights) {
      const formatted = format(date, 'yyyy-MM-dd'); // ⬅️ hier string für DB
      const availability = await this.availabilityRepository.findOne({
        where: { date: formatted },
      });

      if (availability) {
        availability.occupied = Math.max(0, availability.occupied - numberOfCars);
        await this.availabilityRepository.save(availability);
      }
    }

    await this.bookingRepository.remove(booking);

    return { message: `Buchung ${bookingId} wurde vollständig gelöscht.` };
  }





  async getBookingsInRange(from: string, to: string) {
    const cars = await this.carRepository.find({
      where: {
        isCancelled: false,
        checkInDate: LessThanOrEqual(to),
        checkOutDate: MoreThan(from),
      },
      relations: ['booking'],
    });

    return cars.map((car) => ({
      id: car.booking.booking_id,
      guestName: `${car.booking.firstName} ${car.booking.lastName}`,
      spot: car.car_id,
      checkIn: car.checkInDate,
      checkOut: car.checkOutDate,
      carPlate: car.carPlate,
      adults: car.adults,
      children: car.children,
      status: car.booking.status,
      source: car.booking.source,
    }));
  }

  async getBookingStatus(bookingId: string): Promise<{ status: string }> {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Buchung ${bookingId} nicht gefunden.`);
    }

    return { status: booking.status };
  }


  async updateStatus(bookingId: string, newStatus: string) {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Buchung nicht gefunden');
    }

    booking.status = newStatus;
    await this.bookingRepository.save(booking);

    return { message: `Status auf ${newStatus} gesetzt.` };
  }

  async getBookingById(bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Buchung ${bookingId} nicht gefunden.`);
    }

    const cars = await this.carRepository.find({
      where: { booking_id: bookingId, isCancelled: false },
    });

    const priceBase = cars.reduce((acc, c) => acc + Number(c.basePrice ?? 0), 0);
    const priceTax = cars.reduce((acc, c) => acc + Number(c.touristTax ?? 0), 0);

    return {
      id: booking.booking_id,
      checkIn: cars[0]?.checkInDate ?? null,
      checkOut: cars[0]?.checkOutDate ?? null,
      status: booking.status,
      spot: cars[0]?.car_slot ?? null,

      guestName: `${booking.firstName} ${booking.lastName}`,
      guest: {
        salutation: booking.salutation,
        firstName: booking.firstName,
        lastName: booking.lastName,
        nationality: booking.nationality,
        email: booking.email,
        phoneCountryCode: booking.phoneCountryCode,
        phoneNumber: booking.phoneNumber,
      },

      cars: cars.map((car) => ({
        carPlate: car.carPlate,
        adults: car.adults,
        children: car.children,
        basePrice: Number(car.basePrice ?? 0),
        touristTax: Number(car.touristTax ?? 0),
      })),

      priceBase,
      priceTax,
      priceTotal: Number(booking.totalPrice ?? 0),

      // ✅ Zusätzliche Felder:
      createdAt: booking.createdAt,
      statusUpdatedAt: booking.statusUpdatedAt,
      source: booking.source,
      notizen: booking.notizen,
    };
  }


  async updateBooking(bookingId: string, updateData: Partial<Booking>) {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Buchung ${bookingId} nicht gefunden.`);
    }

    // Nur erlaubte Felder übernehmen
    const allowedFields: (keyof Booking)[] = [
      'salutation',
      'firstName',
      'lastName',
      'nationality',
      'phoneCountryCode',
      'phoneNumber',
      'email',
      'notizen',
      'status',
      'source',
      'statusUpdatedAt',
      'totalPrice',
      'refundedAmount',
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (booking as any)[field] = updateData[field];
      }
    }


    await this.bookingRepository.save(booking);
    return { message: 'Buchung erfolgreich aktualisiert.' };
  }


}


