import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { DataSource, Between } from 'typeorm';




@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    private readonly dataSource: DataSource
  ) {}

  // 📆 Kalenderansicht der Verfügbarkeit abrufen
  async getAvailabilityForYear(year: number): Promise<any[]> {
    return this.availabilityRepository
      .createQueryBuilder('availability')
      .where('EXTRACT(YEAR FROM availability.date) = :year', { year })
      .getMany();

  }

  // ❌ Alle belegten Tage abrufen
  async getUnavailableDates(numberOfCars: number): Promise<{ date: string }[]> {
    console.log(`🚀 Checking unavailable dates for ${numberOfCars} cars`);
    
    const result = await this.availabilityRepository
    .createQueryBuilder('availability')
    .select('availability.date',  'date')
    .where('availability.occupied + :numberOfCars > 5', { numberOfCars })
    .getRawMany();

    console.log('📌 Unavailable Dates Response:', result);
    return result;
    
  }
  

  // ✅ Prüfen, ob für den Zeitraum Stellplätze verfügbar sind
  async isAvailable(checkInDate: string, checkOutDate: string, numberOfCars: number): Promise<boolean> {

    const entries = await this.availabilityRepository.find({
      where: {
        date: Between(checkInDate, checkOutDate),
      },
    });
    
    const occupied = entries.length
      ? Math.max(...entries.map((entry) => entry.occupied))
      : 0;
    
    return (occupied + numberOfCars) <= 5;
    
    console.log(`🔍 isAvailable() | Von ${checkInDate} bis ${checkOutDate} | Belegt: ${occupied} | Reservierung: ${numberOfCars} | Max: 5`);

    
  }

  // ✅ Belegte Stellplätze für ein Datum abrufen
  async getOccupiedSpots(date: string): Promise<number> {
    const entry = await this.availabilityRepository.findOneBy({ date });
      return entry?.occupied ?? 0;
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
    const entry = await this.availabilityRepository.findOneBy({ date });

    if (!entry) {
      await this.availabilityRepository.insert({ date, occupied: spots });
    } else {
      entry.occupied += spots;
      await this.availabilityRepository.save(entry);
    }
    
  }

  // ➖ Stellplätze für ein Datum verringern (Stornierung)
  async decreaseOccupiedSpots(date: string, spots: number): Promise<void> {
    const entry = await this.availabilityRepository.findOneBy({ date });

    if (entry) {
      entry.occupied = Math.max(0, entry.occupied - spots);
      await this.availabilityRepository.save(entry);
    }
  }

}
