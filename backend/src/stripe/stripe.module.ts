import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config'; 
import { BookingModule } from '@/booking/booking.module';

@Module({
  imports: [
    ConfigModule, 
    BookingModule
  ], 
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService], 
})
export class StripeModule {}
