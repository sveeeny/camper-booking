import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './availability.entity';  // Importiere die Entity
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Availability])], // Hier das Repository registrieren
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService], // Falls andere Module darauf zugreifen müssen
})
export class AvailabilityModule {}
