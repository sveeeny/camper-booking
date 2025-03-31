import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AvailabilityService } from '../availability/availability.service'; 
import { Availability } from '../entities/availability.entity'; 
import { ConfigModule } from '@nestjs/config';  
import { Booking } from 'entities/booking.entity';
import { Car } from 'entities/cars.entity';


@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Booking, Car, Availability]) 
  ],
  controllers: [BookingController],
  providers: [BookingService, AvailabilityService], 
  exports: [TypeOrmModule, BookingService],
})
export class BookingModule {}
