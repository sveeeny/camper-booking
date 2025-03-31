import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DataSource } from 'typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard'; // ✅ Import des Role-Guards
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AvailabilityModule } from 'booking/availability.module';  

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: false,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    BookingModule,
    UserModule,
    AuthModule,
    AvailabilityModule,
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
export class AppModule {}

// ➤ Teste die Datenbankverbindung direkt nach dem Laden
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
dataSource
  .initialize()
  .then(() => console.log('✅ Datenbankverbindung erfolgreich!'))
  .catch((err) => console.error('❌ Fehler bei der Datenbankverbindung:', err));
