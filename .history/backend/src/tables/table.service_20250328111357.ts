import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TableService {
  constructor(private readonly dataSource: DataSource) {}

  async createTablesForYear() {
    console.log(`📌 Überprüfe Tabellen`);

    const bookingsTable = `bookings`;
    const carsTable = `cars`;
    const availabilityTable = `availability`;

    // ✅ Buchungstabelle erstellen
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${bookingsTable} (
        booking_id SERIAL PRIMARY KEY,
        createdAt TIMESTAMP DEFAULT NOW(),
        salutation VARCHAR,
        firstName VARCHAR,
        lastName VARCHAR,
        nationality VARCHAR,
        phoneCountryCode VARCHAR,
        phoneNumber VARCHAR,
        email VARCHAR,
        paymentConfirmed BOOLEAN DEFAULT FALSE,
        totalPrice DECIMAL(10,2),
        refundedAmount DECIMAL(10,2),
        numberOfCars INT NOT NULL DEFAULT 1
      )
    `);

    // ✅ Fahrzeug-Tabelle 
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${carsTable} (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        carPlate VARCHAR,
        checkInDate DATE NOT NULL,
        checkOutDate DATE NOT NULL,
        isCancelled BOOLEAN DEFAULT FALSE,
        adults INT,
        children INT,
        touristTax DECIMAL(5,2),
        FOREIGN KEY (booking_id) REFERENCES ${bookingsTable}(booking_id) ON DELETE CASCADE
      )
    `);

    // ✅ Verfügbarkeits-Tabelle 
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${availabilityTable} (
        date DATE PRIMARY KEY,
        occupied INT DEFAULT 0
      )
    `);

    console.log(`✅ Tabellen sind bereit.`);
  }

  async deleteTables() {
    console.log(`📌clear tables`);

    const bookingsTable = `bookings`;
    const carsTable = `cars`;
    const availabilityTable = `availability`;

    await this.dataSource.query(
      `DROP TABLE ${bookingsTable} CASCADE`
    );
    await this.dataSource.query(
      `DROP TABLE ${carsTable} CASCADE`
    );
    await this.dataSource.query(
      `DROP TABLE ${availabilityTable} CASCADE`
    );

    console.log(`✅ Tabellen gelöscht.`);
  }

}
