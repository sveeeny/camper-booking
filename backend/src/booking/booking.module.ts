import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AvailabilityService } from '../availability/availability.service'; // ✅ Import
import { Availability } from '../entitys/availability.entity'; // ✅ Import der Entity
import { ConfigModule } from '@nestjs/config';  // 🔥 Wichtig: ConfigModule importieren!
import { TableModule } from 'tables/table.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Availability]),
    TableModule 
  ],
  controllers: [BookingController],
  providers: [BookingService, AvailabilityService], // ✅ AvailabilityService hinzufügen
  exports: [BookingService],
})
export class BookingModule {}
