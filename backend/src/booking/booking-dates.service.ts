// src/booking/booking-dates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Car } from '../entities/cars.entity';
import { AvailabilityService } from '../availability/availability.service';
import { CarsDto } from './dto/cars.dto';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';

@Injectable()
export class BookingDatesService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,

    private readonly availabilityService: AvailabilityService
  ) { }

  private formatDateToYMD(date: Date | string): string {
    return typeof date === 'string' ? date : date.toISOString().split('T')[0];
  }

  // 🛎️ Reserviert alle Fahrzeuge (1 Zeile pro Fahrzeug) + Verfügbarkeiten
  async reserveBookingDates(
    checkInDate: string,
    checkOutDate: string,
    numberOfCars: number
  ): Promise<{ success: boolean; message?: string; bookingId?: string }> {
    const isStillAvailable = await this.availabilityService.isAvailable(
      checkInDate,
      checkOutDate,
      numberOfCars
    );

    if (!isStillAvailable) {
      return { success: false, message: 'Stellplätze wurden zwischenzeitlich belegt.' };
    }

    const booking = await this.bookingRepository.save(
      this.bookingRepository.create({ numberOfCars })
    );

    for (let carSlot = 1; carSlot <= numberOfCars; carSlot++) {
      await this.carRepository.save(
        this.carRepository.create({
          car_slot: carSlot,
          carPlate: '',
          checkInDate,
          checkOutDate,
          isCancelled: false,
          adults: 1,
          children: 0,
          touristTax: 0,
          booking,
        })
      );
    }

    // 📆 Blockiere belegte Nächte (von checkIn bis vor checkOut)
    let availDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    while (availDate < endDate) {
      await this.availabilityService.updateSpots(this.formatDateToYMD(availDate), numberOfCars);
      availDate.setDate(availDate.getDate() + 1);
    }

    return { success: true, bookingId: booking.booking_id };
  }

  // 🚗 Fahrzeugdaten aktualisieren (ein Datensatz pro Fahrzeug)
  async updateCarEntries(
    bookingId: string,
    checkInDate: string,
    checkOutDate: string,
    cars: CarsDto[]
  ): Promise<void> {
    for (let i = 0; i < cars.length; i++) {
      const carData = cars[i];
      const carSlot = i + 1;

      const car = await this.carRepository.findOne({
        where: {
          booking_id: bookingId,
          car_slot: carSlot,
        },
        relations: ['booking'],
      });

      if (!car) continue;

      car.carPlate = carData.carPlate;
      car.checkInDate = checkInDate;
      car.checkOutDate = checkOutDate;
      car.isCancelled = carData.isCancelled ?? false;
      car.adults = carData.adults;
      car.children = carData.children;
      car.touristTax = carData.touristTax;
      car.basePrice = carData.basePrice ?? 0;
      
      await this.carRepository.save(car);
    }
  }

  // ❌ Buchung stornieren (und Verfügbarkeiten korrigieren)
  async cancelCarEntries(bookingId: string): Promise<void> {
    const cars = await this.carRepository.find({
      where: { booking_id: bookingId },
    });

    if (cars.length === 0) {
      throw new NotFoundException('Keine Fahrzeuge für diese Buchung gefunden.');
    }

    for (const car of cars) {
      car.isCancelled = true;
      await this.carRepository.save(car);

      const checkIn = new Date(car.checkInDate);
      const checkOut = new Date(car.checkOutDate);

      await this.availabilityService.updateAvailability(
        this.formatDateToYMD(checkIn),
        this.formatDateToYMD(checkOut),
        1,
        false // ➖ Verfügbarkeit verringern
      );
    }
  }

  async updateBookingDatesAndCars(
    bookingId: string,
    dto: CreateBookingCheckDto,
  ): Promise<void> {
    const existingCars = await this.carRepository.find({
      where: { booking_id: bookingId, isCancelled: false },
    });

    if (existingCars.length === 0) {
      throw new NotFoundException('Keine bestehenden Fahrzeuge gefunden.');
    }

    const oldCheckIn = existingCars[0].checkInDate;
    const oldCheckOut = existingCars[0].checkOutDate;
    const oldNumberOfCars = existingCars.length;

    // 1️⃣ Alte Reservierungen freigeben
    await this.availabilityService.updateAvailability(
      oldCheckIn,
      oldCheckOut,
      oldNumberOfCars,
      false, // ➖ Freigeben
    );

    // 2️⃣ Alte Fahrzeuge löschen
    await this.carRepository.delete({ booking_id: bookingId });

    // 3️⃣ Booking aktualisieren (Anzahl Fahrzeuge)
    const booking = await this.bookingRepository.findOneBy({ booking_id: bookingId });
    if (!booking) {
      throw new NotFoundException('Buchung nicht gefunden.');
    }
    booking.numberOfCars = dto.numberOfCars;
    await this.bookingRepository.save(booking);

    // 4️⃣ Neue Reservierungen setzen (Verfügbarkeit)
    await this.availabilityService.updateAvailability(
      dto.checkInDate,
      dto.checkOutDate,
      dto.numberOfCars,
      true, // ➕ Belegen
    );

    // 5️⃣ Neue Fahrzeuge anlegen
    for (let carSlot = 1; carSlot <= dto.numberOfCars; carSlot++) {
      await this.carRepository.save(
        this.carRepository.create({
          car_slot: carSlot,
          carPlate: '',
          checkInDate: dto.checkInDate,
          checkOutDate: dto.checkOutDate,
          isCancelled: false,
          adults: 1,
          children: 0,
          touristTax: 0,
          booking,
        })
      );
    }
  }



}
