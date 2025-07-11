import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AvailabilityService } from '../availability/availability.service'; 
import { Availability } from '../entities/availability.entity'; 
import { ConfigModule } from '@nestjs/config';  
import { Booking } from '@/entities/booking.entity';
import { Car } from '@/entities/cars.entity';
import { BookingDatesService } from './booking-dates.service';
import { ResendModule } from '@/resend/resend.module';
import { SettingsModule } from '@/settings/settings.module';
import { cleanupTimers } from './booking-timers';
import { forwardRef } from '@nestjs/common';
import { StripeModule } from '@/stripe/stripe.module';
import { BookingCronService } from './booking-cron.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Booking, Car, Availability]),
    ResendModule,
    SettingsModule, 
    forwardRef(() => StripeModule),
  ],
  controllers: [BookingController],
  providers: [BookingService, AvailabilityService, BookingDatesService, BookingCronService], 
  exports: [TypeOrmModule, BookingService],
})
export class BookingModule {}
