import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AvailabilityService } from './availability.service'; // ✅ Import
import { Availability } from './availability.entity'; // ✅ Import der Entity
import { ConfigModule } from '@nestjs/config';  // 🔥 Wichtig: ConfigModule importieren!
import { TableModule } from './table.module'; // ✅ Import hinzufügen

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
