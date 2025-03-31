import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { ConfigService } from '@nestjs/config';
import { TableService } from '../tables/table.service';  // ✅ Importieren
import { AvailabilityService } from '../availability/availability.service';
 

@Injectable()
export class BookingService {
  private maxBookingFutureDays: number;
  private tableCreationThresholdDays: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly tableService: TableService,
    private readonly availabilityService: AvailabilityService
  ) {
    this.maxBookingFutureDays = this.configService.get<number>('MAX_BOOKING_FUTURE_DAYS', 540);
    this.tableCreationThresholdDays = this.configService.get<number>('TABLE_CREATION_THRESHOLD_DAYS', 365);
  }


  // Buchung provisorisch speichern
  async checkAvailability(checkInDate: string, checkOutDate: string, numberOfCars: number) {
    
    // Letzte Prüfung, ob Plätze frei sind
    const isStillAvailable = await this.availabilityService.isAvailable(checkInDate, checkOutDate, numberOfCars);
    if (!isStillAvailable) {
      return { success: false, message: "Stellplätze wurden zwischenzeitlich belegt." };
    }

    // bookings-Tabelle
    const newBooking = await this.dataSource.query(`
      INSERT INTO bookings (numberOfCars)
      VALUES ($1) RETURNING booking_id
    `, [numberOfCars]);


    // cars-Tabelle
    let currentDate = new Date(checkInDate);
    let currentCheckOutDate = new Date()
    currentCheckOutDate.setDate(currentDate.getDate() + 1);
    
    const endDate = new Date(checkOutDate);
  
    while (currentDate < endDate) {
      await this.dataSource.query(`
        INSERT INTO cars (booking_id, checkInDate, checkOutDate)
        VALUES ($1, $2, $3)
      `, [newBooking[0].booking_id, currentDate.toISOString().split('T')[0], currentCheckOutDate.toISOString().split('T')[0]]);
  
      currentDate.setDate(currentDate.getDate() + 1);
      currentCheckOutDate.setDate(currentCheckOutDate.getDate() + 1);
    }


    // availability Tabelle
    currentDate = new Date(checkInDate);
    while (currentDate < endDate) {

      await this.availabilityService.increaseOccupiedSpots(currentDate.toISOString().split('T')[0], numberOfCars);
    
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return { success: true, bookingId: newBooking[0].booking_id };
  }
  
  

  // async checkAvailability(checkInDate: string, checkOutDate: string, numberOfCars: number) {
  //   // const bookingYear = new Date(checkInDate).getFullYear();
  //   // // await this.tableService.createTablesForYear();
  //   // const bookingsTable = this.getBookingTableName(checkInDate);
  //   // const bookingsTable = 'bookings';

  //   // 📌 Letzte Prüfung, ob Plätze frei sind
  //   const isStillAvailable = await this.availabilityService.isAvailable(checkInDate, checkOutDate, numberOfCars);
  //   if (!isStillAvailable) {
  //     return { success: false, message: "Stellplätze wurden zwischenzeitlich belegt." };
  //   }
  
  //   // ✅ Buchung speichern
  //   // const newBooking = await this.dataSource.query(`
  //   //   INSERT INTO $bookings (numberOfCars)
  //   //   VALUES ($1) RETURNING booking_id
  //   // `, [numberOfCars]);
  
    
  //   // 🏎 Autos hinzufügen
  //   // let currentDate = new Date(checkInDate);
  //   // const endDate = new Date(checkOutDate);
  
  //   // while (currentDate < endDate) {
  //   //   await this.dataSource.query(`
  //   //     INSERT INTO cars (booking_id, checkInDate, checkOutDate)
  //   //     VALUES ($1, $2, $3)
  //   //   `, [newBooking[0].booking_id, currentDate.toISOString().split('T')[0], currentDate.getDate() + 1]);
  
  //   //   currentDate.setDate(currentDate.getDate() + 1);
  //   // }
  
  //   // 📆 Verfügbarkeit erhöhen (nochmal prüfen!)
  //   currentDate = new Date(checkInDate);
  //   while (currentDate < endDate) {
  //     const stillAvailable = await this.availabilityService.isAvailable(checkInDate, checkOutDate, numberOfCars);
  //     if (!stillAvailable) {
  //       return { success: false, message: "Stellplätze wurden gerade belegt." };
  //     }
  
  //     await this.availabilityService.increaseOccupiedSpots(currentDate.toISOString().split('T')[0], numberOfCars);
    
  //     currentDate.setDate(currentDate.getDate() + 1);
  //   }
  
  //   return { success: true, bookingId: newBooking[0].booking_id };
  // }


  // 📌 Speichert eine neue Buchung
  async createBooking(dto: CreateBookingGuestDto): Promise<any> {
    const year = new Date(dto.checkInDate).getFullYear();
    

    const bookingTable = `bookings_${year}`;
    const carsTable = `cars`;

    const result = await this.dataSource.query(`
      INSERT INTO ${bookingTable} (salutation, firstName, lastName, nationality, phoneCountryCode, phoneNumber, email, numberOfCars, totalPrice)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING booking_id
    `, [dto.salutation, dto.firstName, dto.lastName, dto.nationality, dto.phoneCountryCode, dto.phoneNumber, dto.email, dto.spotAssignments.length, dto.totalPrice]);

    const bookingId = result[0].booking_id;

    for (const spot of dto.spotAssignments) {
      await this.dataSource.query(`
        INSERT INTO ${carsTable} (booking_id, carPlate, checkInDate, checkOutDate, adults, children, touristTax)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [bookingId, spot.carPlate, dto.checkInDate, dto.checkOutDate, spot.guestsAbove14, spot.guestsBelow14, spot.touristTax]);

      await this.dataSource.query(`
        UPDATE availability SET occupied = occupied + 1
        WHERE date >= $1 AND date < $2
      `, [dto.checkInDate, dto.checkOutDate]);
    }

    return { message: 'Buchung erfolgreich gespeichert!', bookingId };
  }

  async completeGuestInfo(createBookingGuestDto: CreateBookingGuestDto): Promise<any> {
    const bookingTable = `bookings_${new Date(createBookingGuestDto.checkInDate).getFullYear()}`;
  
    await this.dataSource.query(
      `UPDATE ${bookingTable} SET 
        firstName = $1, lastName = $2, salutation = $3, nationality = $4, 
        email = $5, phoneNumber = $6
      WHERE booking_id = $7`,
      [
        createBookingGuestDto.firstName,
        createBookingGuestDto.lastName,
        createBookingGuestDto.salutation,
        createBookingGuestDto.nationality,
        createBookingGuestDto.email,
        createBookingGuestDto.phoneNumber,
        createBookingGuestDto.bookingId
      ]
    );
  
    return { message: 'Gästeinformationen erfolgreich gespeichert!' };
  }

  async deleteBooking(bookingId: number, year: number): Promise<{ message: string }> {
    const bookingTable = `bookings`;
  
    await this.dataSource.query(
      `UPDATE ${bookingTable} SET isCancelled = TRUE WHERE booking_id = $1`,
      [bookingId]
    );
  
    return { message: `Buchung ${bookingId} für ${year} wurde storniert.` };
  }
  
  

  // 📌 Storniert eine Buchung
  async cancelBooking(bookingId: number): Promise<{ message: string }> {
    // 🔍 Das Jahr der Buchung abrufen
    const result = await this.dataSource.query(`
      SELECT EXTRACT(YEAR FROM checkInDate) as year FROM cars WHERE booking_id = $1
    `, [bookingId]);

    if (result.length === 0) {
      throw new NotFoundException('Buchung nicht gefunden.');
    }

    const year = result[0].year;

    const carEntries = await this.dataSource.query(`
      SELECT checkInDate, checkOutDate FROM cars WHERE booking_id = $1
    `, [bookingId]);

    await this.dataSource.query(`
      UPDATE cars SET isCancelled = TRUE WHERE booking_id = $1
    `, [bookingId]);

    for (const car of carEntries) {
      await this.dataSource.query(`
        UPDATE availability SET occupied = occupied - 1
        WHERE date >= $1 AND date < $2
      `, [car.checkInDate, car.checkOutDate]);
    }

    return { message: 'Buchung wurde storniert.' };
}

}
