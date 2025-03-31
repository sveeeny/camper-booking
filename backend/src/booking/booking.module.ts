import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AvailabilityService } from '../availability/availability.service'; 
import { Availability } from '../entitys/availability.entity'; 
import { ConfigModule } from '@nestjs/config';  
import { TableModule } from 'tables/table.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Availability]),
    TableModule 
  ],
  controllers: [BookingController],
  providers: [BookingService, AvailabilityService], 
  exports: [BookingService],
})
export class BookingModule {}
