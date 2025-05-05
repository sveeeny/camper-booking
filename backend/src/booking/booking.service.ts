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
import { LessThanOrEqual, MoreThan } from 'typeorm';
// import eachDayOfInterval from 'date-fns/eachDayOfInterval';



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
  
    private readonly bookingDatesService: BookingDatesService,
  ) {
    this.maxBookingFutureDays = this.configService.get<number>('MAX_BOOKING_FUTURE_DAYS', 540);
    this.tableCreationThresholdDays = this.configService.get<number>('TABLE_CREATION_THRESHOLD_DAYS', 365);
  }
  
  

  //Neue checkAvailability
  async checkAvailability(checkInDate: string, checkOutDate: string, numberOfCars: number) {
    return this.bookingDatesService.reserveBookingDates(checkInDate, checkOutDate, numberOfCars);
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
  async deleteBooking(bookingId: number): Promise<{ message: string }> {
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
  
  
  

  //Neue cancelBooking
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
    }));
  }



}

const formatDateToYMD = (date: Date | string): string =>
  typeof date === 'string' ? date : date.toISOString().split('T')[0];
