import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config'; 
import { BookingModule } from '@/booking/booking.module';
import { ResendModule } from '@/resend/resend.module';
import { SettingsModule } from '@/settings/settings.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule, 
    forwardRef(() => BookingModule),
    ResendModule, 
    SettingsModule,   
  ], 
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService], 
})
export class StripeModule {}
