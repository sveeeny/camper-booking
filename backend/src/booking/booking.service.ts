import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { ConfigService } from '@nestjs/config';
import { AvailabilityService } from '../availability/availability.service';
import { Booking } from '../entities/booking.entity';
import { Car } from '../entities/cars.entity';
import { Availability } from '../entities/availability.entity';



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
    private readonly availabilityService: AvailabilityService
  ) 
  {
    this.maxBookingFutureDays = this.configService.get<number>('MAX_BOOKING_FUTURE_DAYS', 540);
    this.tableCreationThresholdDays = this.configService.get<number>('TABLE_CREATION_THRESHOLD_DAYS', 365);
  }



  
  // Buchung provisorisch speichern
  async checkAvailability(checkInDate: string, checkOutDate: string, numberOfCars: number) {
    const isStillAvailable = await this.availabilityService.isAvailable(checkInDate, checkOutDate, numberOfCars);
    if (!isStillAvailable) {
      return { success: false, message: 'Stellplätze wurden zwischenzeitlich belegt.' };
    }
  
    const booking = await this.bookingRepository.save(
      this.bookingRepository.create({ numberOfCars })
    );
  
    const checkIn = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
  
    for (let carId = 1; carId <= numberOfCars; carId++) {
      let currentNight = new Date(checkIn);
  
      while (currentNight < endDate) {
        const checkOut = new Date(currentNight);
        checkOut.setDate(checkOut.getDate() + 1);
  
        await this.carRepository.save(
          this.carRepository.create({
            car_id: carId,
            carPlate: '',
            checkInDate: formatDateToYMD(currentNight),
            checkOutDate: formatDateToYMD(checkOut),
            isCancelled: false,
            adults: 1,
            children: 0,
            touristTax: 0,
            booking: booking, // Relation statt bookingId
          })
        );
  
        currentNight.setDate(currentNight.getDate() + 1);
      }
    }
  
    // Belegung aktualisieren
    let availDate = new Date(checkInDate);
    const end = new Date(checkOutDate);
  
    while (availDate < end) {
      await this.availabilityService.increaseOccupiedSpots(
        formatDateToYMD(availDate),
        numberOfCars
      );
      availDate.setDate(availDate.getDate() + 1);
    }
  
    return { success: true, bookingId: booking.booking_id };
  }
  
  // 📌 Speichert eine neue Buchung   
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
  
    // ➕ Fahrzeugeinträge aktualisieren
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const numberOfNights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
  
    for (let i = 0; i < dto.cars.length; i++) {
      const carData = dto.cars[i];
      const carId = i + 1;
  
      let currentNight = new Date(dto.checkInDate);
  
      for (let n = 0; n < numberOfNights; n++) {
        const checkInDate = new Date(currentNight);
        const checkOutDate = new Date(currentNight);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
  
        const car = await this.carRepository.findOne({
          where: {
            booking_id: dto.bookingId,
            car_id: carId,
            checkInDate: formatDateToYMD(checkInDate),
          },
          relations: ['booking'],
        });
  
        if (!car) continue;
  
        car.carPlate = carData.carPlate;
        car.checkOutDate = formatDateToYMD(checkOutDate);
        car.isCancelled = carData.isCancelled ?? false;
        car.adults = carData.adults;
        car.children = carData.children;
        car.touristTax = carData.touristTax;
  
        await this.carRepository.save(car);
  
        currentNight.setDate(currentNight.getDate() + 1);
      }
    }
  
    return { message: 'Buchung erfolgreich gespeichert!', bookingId: booking.booking_id };
  }
  

  //HARD DELETE
  async deleteBooking(bookingId: number, year: number): Promise<{ message: string }> {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: bookingId },
      relations: ['cars'],
    });
  
    if (!booking) {
      throw new NotFoundException(`Buchung ${bookingId} nicht gefunden.`);
    }
  
    // Alle zugehörigen Fahrzeuge werden dank "cascade: true" automatisch gelöscht
    await this.bookingRepository.remove(booking);
  
    return { message: `Buchung ${bookingId} für ${year} wurde vollständig gelöscht.` };
  }
  
  
  // 📌 Storniert eine Buchung

  async cancelBooking(bookingId: number): Promise<{ message: string }> {
    // 1. Hole alle Car-Einträge zur Buchung
    const cars = await this.carRepository.find({
      where: { booking_id: bookingId },
    });
  
    if (cars.length === 0) {
      throw new NotFoundException('Keine Fahrzeuge für diese Buchung gefunden.');
    }
  
    // 2. Setze isCancelled für alle Fahrzeuge
    for (const car of cars) {
      car.isCancelled = true;
      await this.carRepository.save(car);
  
      // 3. Verfügbarkeit anpassen für jede Nacht
      const checkIn = new Date(car.checkInDate);
      const checkOut = new Date(car.checkOutDate);
  
      await this.availabilityRepository.decrement(
        { date: formatDateToYMD(checkIn) },
        'occupied',
        1
      );
    }
  
    return { message: `Buchung ${bookingId} wurde storniert.` };
  }
  

}

const formatDateToYMD = (date: Date | string): string =>
  typeof date === 'string' ? date : date.toISOString().split('T')[0];
