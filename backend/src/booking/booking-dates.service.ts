// src/booking/booking-dates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Car } from '../entities/cars.entity';
import { AvailabilityService } from '../availability/availability.service';
import { CarsDto } from './dto/cars.dto';

@Injectable()
export class BookingDatesService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,

    private readonly availabilityService: AvailabilityService
  ) {}

  private formatDateToYMD(date: Date | string): string {
    return typeof date === 'string' ? date : date.toISOString().split('T')[0];
  }

  // 🛎️ Reserviert alle Fahrzeuge (1 Zeile pro Fahrzeug) + Verfügbarkeiten
  async reserveBookingDates(
    checkInDate: string,
    checkOutDate: string,
    numberOfCars: number
  ): Promise<{ success: boolean; message?: string; bookingId?: number }> {
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

    for (let carId = 1; carId <= numberOfCars; carId++) {
      await this.carRepository.save(
        this.carRepository.create({
          car_id: carId,
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
    bookingId: number,
    checkInDate: string,
    checkOutDate: string,
    cars: CarsDto[]
  ): Promise<void> {
    for (let i = 0; i < cars.length; i++) {
      const carData = cars[i];
      const carId = i + 1;

      const car = await this.carRepository.findOne({
        where: {
          booking_id: bookingId,
          car_id: carId,
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

      await this.carRepository.save(car);
    }
  }

  // ❌ Buchung stornieren (und Verfügbarkeiten korrigieren)
  async cancelCarEntries(bookingId: number): Promise<void> {
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
}
