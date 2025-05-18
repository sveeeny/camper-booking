import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from '@/booking/booking.module';
import { UserModule } from '@/user/user.module';
import { AuthModule } from '@/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@/auth/roles.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AvailabilityModule } from '@/availability/availability.module';
import { AppDataSource } from 'data-source';
import { StripeModule } from '@/stripe/stripe.module';
import { SettingsModule } from '@/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(AppDataSource.options),
    BookingModule,
    UserModule,
    AuthModule,
    AvailabilityModule,
    StripeModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 🔥 Stellt sicher, dass der AuthGuard global aktiv ist!
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 🔥 Stellt sicher, dass der RolesGuard aktiv ist!
    },
  ],
})
export class AppModule { }
