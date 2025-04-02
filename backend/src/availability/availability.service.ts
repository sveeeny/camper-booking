import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { ConfigService } from '@nestjs/config';

const formatDateToYMD = (date: Date | string): string =>
  typeof date === 'string' ? date : date.toISOString().split('T')[0];

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

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
  
  // async getUnavailableDates(numberOfCars: number): Promise<{ date: string }[]> {
  //   console.log(`🚀 Checking unavailable dates for ${numberOfCars} cars`);

  //   const result = await this.availabilityRepository
  //     .createQueryBuilder('availability')
  //     .select(`TO_CHAR(availability.date, 'YYYY-MM-DD')`, 'date')
  //     .where('availability.occupied + :numberOfCars > 5', { numberOfCars })
  //     .getRawMany();

  //   console.log('📌 Unavailable Dates Response:', result);
  //   return result;
  // }

  // ✅ Verfügbarkeit prüfen
  async isAvailable(checkInDate: string, checkOutDate: string, numberOfCars: number): Promise<boolean> {
    const entries = await this.availabilityRepository.find({
      where: { date: Between(checkInDate, checkOutDate) },
    });

    const occupied = entries.length
      ? Math.max(...entries.map((entry) => entry.occupied))
      : 0;

    const result = (occupied + numberOfCars) <= 5;

    console.log(
      `🔍 isAvailable() | ${checkInDate} → ${checkOutDate} | Belegt: ${occupied} | Reservierung: ${numberOfCars} | Verfügbar: ${result}`
    );

    return result;
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
