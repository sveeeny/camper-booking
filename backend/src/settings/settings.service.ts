// src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '@/entities/settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  // Hole das zentrale Settings-Objekt (oder lege es an)
  async getSettings(): Promise<Settings> {
    let settings = await this.settingsRepository.findOne({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        id: 'singleton',
        adultTax: 2,
        childTax: 0,
        pricePerNightPerCar: 30,
        maxGuestsPerCar: 6,
        bookingAdvanceDays: 180,
        minNights: 1,
        maxNights: 14,
        checkInTime: '13:00',
        checkOutTime: '12:00',
        cancellationWindow: 3,
        cancellationFee: 20,
      });

      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  // Aktualisiere einzelne Settings-Werte
  async updateSettings(updated: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const merged = Object.assign(current, updated);
    return this.settingsRepository.save(merged);
  }
}
