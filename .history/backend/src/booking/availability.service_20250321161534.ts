import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './availability.entity';
import { DataSource } from 'typeorm';




@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    private readonly dataSource: DataSource
  ) {}

  // 📆 Kalenderansicht der Verfügbarkeit abrufen
  async getAvailabilityForYear(year: number): Promise<any[]> {
    return this.dataSource.query(
      `SELECT * FROM availability WHERE EXTRACT(YEAR FROM date) = $1`,
      [year]
    );
  }

  // ❌ Alle belegten Tage abrufen
  async getUnavailableDates(numberOfCars: number): Promise<{ date: string }[]> {
    console.log(`🚀 Checking unavailable dates for ${numberOfCars} cars`);
    
    const result = await this.dataSource.query(
      `SELECT date FROM availability WHERE occupied + $1 > 5`,
      [numberOfCars]
    );
  
    console.log(`📌 Unavailable Dates Response:`, result);
    return result;
  }
  

  // ✅ Prüfen, ob für den Zeitraum Stellplätze verfügbar sind
  async isAvailable(checkInDate: string, checkOutDate: string, numberOfCars: number): Promise<boolean> {
    const totalOccupied = await this.dataSource.query(`
      SELECT occupied
      FROM availability
      WHERE date >= $1 AND date < $2
    `, [checkInDate, checkOutDate]);
    
    console.log(totalOccupied);
    const occupied = Math.max(...totalOccupied) || 0;
    const maxCapacity = 5;

    console.log(`🔍 isAvailable() | Von ${checkInDate} bis ${checkOutDate} | Belegt: ${occupied} | Reservierung: ${numberOfCars} | Max: ${maxCapacity}`);

    return (occupied + numberOfCars) <= maxCapacity;
  }

  // ✅ Belegte Stellplätze für ein Datum abrufen
  async getOccupiedSpots(date: string): Promise<number> {
    const entry = await this.dataSource.query(
      `SELECT date, occupied FROM availability WHERE date = $1 LIMIT 1`,
      [date]
    );
    
    return entry ? entry.occupied : 0;
  }

  // 🛠 Verfügbarkeit für einen Zeitraum aktualisieren (hoch oder runter)
  async updateAvailability(checkInDate: string, checkOutDate: string, numberOfCars: number, increase: boolean) {
    let currentDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    while (currentDate < endDate) {
      const dateString = currentDate.toISOString().split('T')[0];

      if (increase) {
        await this.increaseOccupiedSpots(dateString, numberOfCars);
      } else {
        await this.decreaseOccupiedSpots(dateString, numberOfCars);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // ➕ Stellplätze für ein Datum erhöhen (Buchung)
  async increaseOccupiedSpots(date: string, spots: number): Promise<void> {
    const entry = await this.dataSource.query(
      `SELECT occupied FROM availability WHERE date = $1 LIMIT 1`,
      [date]
    );

    if (entry.length === 0) {
      await this.dataSource.query(
        `INSERT INTO availability (date, occupied) VALUES ($1, $2)`,
        [date, spots]
      );
    } else {
      await this.dataSource.query(
        `UPDATE availability SET occupied = occupied + $1 WHERE date = $2`,
        [spots, date]
      );
    }
  }

  // ➖ Stellplätze für ein Datum verringern (Stornierung)
  async decreaseOccupiedSpots(date: string, spots: number): Promise<void> {
    const entry = await this.dataSource.query(
      `SELECT occupied FROM availability WHERE date = $1 LIMIT 1`,
      [date]
    );

    if (entry.length > 0) {
      await this.dataSource.query(
        `UPDATE availability SET occupied = GREATEST(0, occupied - $1) WHERE date = $2`,
        [spots, date]
      );
    }
  }

}
