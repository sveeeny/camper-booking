import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TableService {
  constructor(private readonly dataSource: DataSource) {}

  async createTablesForYear(year: number) {
    console.log(`📌 Überprüfe Tabellen für ${year}...`);

    const bookingsTable = `bookings_${year}`;
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

    // ✅ Fahrzeug-Tabelle (bleibt immer gleich)
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

    // ✅ Verfügbarkeits-Tabelle (bleibt immer gleich)
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${availabilityTable} (
        date DATE PRIMARY KEY,
        occupied INT DEFAULT 0
      )
    `);

    console.log(`✅ Tabellen für ${year} sind bereit.`);
  }

  // Automatischer Check für neue Jahr-Tabelle am 1. Januar
  async ensureNextYearTableExists() {
    const nextYear = new Date().getFullYear() + 1;
    await this.createTablesForYear(nextYear);
  }
}
