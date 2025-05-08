import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { ConfigService } from '@nestjs/config';
import { LessThan, MoreThanOrEqual } from 'typeorm';
import { Car } from '@/entities/cars.entity';


const formatDateToYMD = (date: Date | string): string =>
  typeof date === 'string' ? date : date.toISOString().split('T')[0];

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    
    @InjectRepository(Car) // NEU??
    private readonly carRepository: Repository<Car>,
    
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) { }

  // 📅 Kalenderansicht eines Jahres
  async getAvailabilityForYear(year: number): Promise<any[]> {
    return this.availabilityRepository
      .createQueryBuilder('availability')
      .where('EXTRACT(YEAR FROM availability.date) = :year', { year })
      .getMany();
  }

  // ❌ Belegte Tage abrufen
  async getUnavailableDates(numberOfCars: number): Promise<{ date: string }[]> {
    const today = new Date();
    const formattedToday = formatDateToYMD(today);
    const maxSpots = this.configService.get<number>('MAX_SPOTS', 5); // Standard: 5

    const result = await this.availabilityRepository
      .createQueryBuilder('availability')
      .select(`TO_CHAR(availability.date, 'YYYY-MM-DD')`, 'date')
      .where('availability.occupied + :numberOfCars > :maxSpots', {
        numberOfCars,
        maxSpots,
      })
      .andWhere('availability.date >= :today', { today: formattedToday }) // keine Vergangenheit
      .getRawMany();

    return result;
  }


  // ✅ Verfügbarkeit prüfen

  async isAvailable(
    checkInDate: string,
    checkOutDate: string,
    numberOfCars: number,
    bookingId?: number,  // optional
  ): Promise<boolean> {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    end.setDate(end.getDate() - 1);
  
    // 1️⃣ Hole alle Availability-Daten für den Bereich
    const entries = await this.availabilityRepository.find({
      where: {
        date: Between(
          formatDateToYMD(start),
          formatDateToYMD(end)
        ),
      },
    });
  
    const availabilityMap = new Map(
      entries.map((entry) => [entry.date, entry.occupied])
    );
  
    // 2️⃣ Hole alte Fahrzeuganzahl aus der Cars-Tabelle (falls bookingId angegeben)
    let previousCarCount = 0;
    if (bookingId) {
      const cars = await this.carRepository.find({
        where: {
          booking_id: bookingId,
          isCancelled: false,
        },
      });
      previousCarCount = cars.length;
    }
  
    const nights: string[] = [];
    const loopDate = new Date(start);
  
    while (loopDate <= end) {
      const ymd = formatDateToYMD(loopDate);
      nights.push(ymd);
  
      const occupied = availabilityMap.get(ymd) || 0;
      // NEU: Rechne eigene Buchung raus
      const occupiedWithoutCurrent = occupied - previousCarCount;
      const willBeOccupied = occupiedWithoutCurrent + numberOfCars;
  
      console.log(
        `🛏️ Prüfe Nacht: ${ymd} | Belegt (gesamt): ${occupied} | - eigene: ${previousCarCount} | + neu: ${numberOfCars} | Ergebnis: ${willBeOccupied} von max 5`
      );
  
      if (willBeOccupied > 5) {
        return false;
      }
  
      loopDate.setDate(loopDate.getDate() + 1);
    }
  
    return true;
  }
  



  // 🔢 Belegte Stellplätze für ein Datum abrufen
  async getOccupiedSpots(date: string | Date): Promise<number> {
    const entry = await this.availabilityRepository.findOneBy({ date: formatDateToYMD(date) });
    return entry?.occupied ?? 0;
  }

  // 🛠 Verfügbarkeit für Zeitraum anpassen (Buchung / Storno)
  async updateAvailability(
    checkInDate: string,
    checkOutDate: string,
    numberOfCars: number,
    increase: boolean
  ): Promise<void> {
    let currentDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    while (currentDate < endDate) {
      await this.updateSpots(currentDate, increase ? numberOfCars : -numberOfCars);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // 🧮 Stellplätze für Datum erhöhen oder verringern
  async updateSpots(date: string | Date, delta: number): Promise<void> {
    const formattedDate = formatDateToYMD(date);
    const entry = await this.availabilityRepository.findOneBy({ date: formattedDate });

    if (!entry) {
      await this.availabilityRepository.insert({
        date: formattedDate,
        occupied: Math.max(0, delta),
      });
    } else {
      entry.occupied = Math.max(0, entry.occupied + delta);
      await this.availabilityRepository.save(entry);
    }
  }
}
