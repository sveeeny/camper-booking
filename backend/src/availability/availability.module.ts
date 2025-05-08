import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from '../entities/availability.entity';  // Importiere die Entity
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { ConfigModule } from '@nestjs/config';
import { Car } from '@/entities/cars.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Car]),
    ConfigModule
  ], // Hier das Repository registrieren
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService], // Falls andere Module darauf zugreifen müssen
})
export class AvailabilityModule {}
