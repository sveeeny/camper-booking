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

  // 🛎️ Reserviert alle Fahrzeug- und Verfügbarkeitsdaten
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
            checkInDate: this.formatDateToYMD(currentNight),
            checkOutDate: this.formatDateToYMD(checkOut),
            isCancelled: false,
            adults: 1,
            children: 0,
            touristTax: 0,
            booking: booking,
          })
        );

        currentNight.setDate(currentNight.getDate() + 1);
      }
    }

    let availDate = new Date(checkInDate);
    while (availDate < endDate) {
      await this.availabilityService.updateSpots(availDate, numberOfCars);
      availDate.setDate(availDate.getDate() + 1);
    }

    return { success: true, bookingId: booking.booking_id };
  }

  // 🚗 Fahrzeugdaten aktualisieren
  async updateCarEntries(
    bookingId: number,
    checkInDate: string,
    checkOutDate: string,
    cars: CarsDto[]
  ): Promise<void> {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const numberOfNights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);

    for (let i = 0; i < cars.length; i++) {
      const carData = cars[i];
      const carId = i + 1;
      let currentNight = new Date(checkIn);

      for (let n = 0; n < numberOfNights; n++) {
        const currentCheckIn = new Date(currentNight);
        const currentCheckOut = new Date(currentNight);
        currentCheckOut.setDate(currentCheckOut.getDate() + 1);

        const car = await this.carRepository.findOne({
          where: {
            booking_id: bookingId,
            car_id: carId,
            checkInDate: this.formatDateToYMD(currentCheckIn),
          },
          relations: ['booking'],
        });

        if (!car) continue;

        car.carPlate = carData.carPlate;
        car.checkOutDate = this.formatDateToYMD(currentCheckOut);
        car.isCancelled = carData.isCancelled ?? false;
        car.adults = carData.adults;
        car.children = carData.children;
        car.touristTax = carData.touristTax;

        await this.carRepository.save(car);
        currentNight.setDate(currentNight.getDate() + 1);
      }
    }
  }

  // ❌ Buchung stornieren (isCancelled setzen & Verfügbarkeit anpassen)
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
