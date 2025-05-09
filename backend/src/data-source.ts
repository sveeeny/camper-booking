// src/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Booking } from './entities/booking.entity';
import { Car } from './entities/cars.entity';
import { Availability } from './entities/availability.entity';
import { User } from './user/user.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Booking, Car, Availability, User],
  
  //Für Migrationen
  // migrations: ['src/migrations/*.ts'],
  
  //Für Production
  migrations: ['dist/migrations/*.js'],
  
  synchronize: false,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
