import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { ConfigService } from '@nestjs/config';
import { TableService } from '../tables/table.service';  
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
    const endDate = new Date(checkOutDate);
    
    for (let carId = 1; carId <= numberOfCars; carId++) {
      let currentNight = new Date(currentDate);
    
      while (currentNight < endDate) {
        const checkIn = new Date(currentNight);
        const checkOut = new Date(currentNight);
        checkOut.setDate(checkOut.getDate() + 1);
    
        await this.dataSource.query(`
          INSERT INTO cars (booking_id, car_id, checkInDate, checkOutDate)
          VALUES ($1, $2, $3, $4)
        `, [
          newBooking[0].booking_id,
          carId,
          checkIn.toISOString().split('T')[0],
          checkOut.toISOString().split('T')[0],
        ]);
    
        currentNight.setDate(currentNight.getDate() + 1);
      }
    }
    
    // let currentDate = new Date(checkInDate);
    // const endDate = new Date(checkOutDate);

    // while (currentDate < endDate) {
    //   const checkIn = new Date(currentDate); // neue Kopie
    //   const checkOut = new Date(currentDate);
    //   checkOut.setDate(checkOut.getDate() + 1);

    //   await this.dataSource.query(`
    //     INSERT INTO cars (booking_id, checkInDate, checkOutDate)
    //     VALUES ($1, $2, $3)
    //   `, [
    //     newBooking[0].booking_id,
    //     checkIn.toISOString().split('T')[0],
    //     checkOut.toISOString().split('T')[0]
    //   ]);

    //   currentDate.setDate(currentDate.getDate() + 1);
    // }



    // availability Tabelle
    currentDate = new Date(checkInDate);
    while (currentDate < endDate) {

      await this.availabilityService.increaseOccupiedSpots(currentDate.toISOString().split('T')[0], numberOfCars);
    
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return { success: true, bookingId: newBooking[0].booking_id };
  }
  
  

  // 📌 Speichert eine neue Buchung   
  async createBooking(dto: CreateBookingGuestDto): Promise<any> {
    const bookingTable = `bookings`;
    const carsTable = `cars`;

    const result = await this.dataSource.query(`
      UPDATE ${bookingTable} SET 
        salutation = $1, 
        firstName = $2,
        lastName = $3,
        nationality = $4,
        phoneCountryCode = $5,
        phoneNumber = $6,
        email = $7,
        totalPrice = $8
      WHERE booking_id = $9
    `, [
      dto.salutation, 
      dto.firstName, 
      dto.lastName, 
      dto.nationality, 
      dto.phoneCountryCode, 
      dto.phoneNumber, 
      dto.email, 
      dto.totalPrice,
      dto.bookingId // Muss vom Frontend mitgesendet werden
    ]
    );

    const bookingId = result[0].booking_id;


    //Cars Tabelle vervollständigen
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);

    const numberOfNights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);


    for (let i = 0; i < dto.cars.length; i++) {
      const car = dto.cars[i];
      const carId = i + 1; // car_id startet bei 1
    
      let currentNight = new Date(dto.checkInDate);
    
      for (let n = 0; n < numberOfNights; n++) {
        const checkIn = new Date(currentNight);
        const checkOut = new Date(currentNight);
        checkOut.setDate(checkOut.getDate() + 1);
    
        // 🛠️ UPDATE cars-Eintrag für diese Nacht
        await this.dataSource.query(`
          UPDATE ${carsTable}
          SET 
            carPlate = $1,
            checkInDate = $2,
            checkOutDate = $3,
            isCancelled = $4,
            adults = $5,
            children = $6,
            touristTax = $7
          WHERE booking_id = $8 AND car_id = $9 AND checkInDate = $2
        `, [
          car.carPlate,
          checkIn.toISOString().split('T')[0],
          checkOut.toISOString().split('T')[0],
          car.isCancelled ?? false,
          car.adults,
          car.children,
          car.touristTax,
          dto.bookingId,
          carId
        ]);
    
        // 📅 Availability-Tabelle aktualisieren für diese Nacht
        // await this.dataSource.query(`
        //   UPDATE availability
        //   SET occupied = occupied + 1
        //   WHERE date = $1
        // `, [
        //   checkIn.toISOString().split('T')[0]
        // ]);
    
        currentNight.setDate(currentNight.getDate() + 1);
      }
    }
    

    return { message: 'Buchung erfolgreich gespeichert!', bookingId };
  }

  async completeGuestInfo(createBookingGuestDto: CreateBookingGuestDto): Promise<any> {
    const bookingTable = `bookings`;
  
    await this.dataSource.query(
      `UPDATE ${bookingTable} SET 
        firstName = $1, 
        lastName = $2, 
        salutation = $3, 
        nationality = $4, 
        email = $5, 
        phoneNumber = $6
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
