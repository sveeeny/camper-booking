import { DataSource } from "typeorm";
import { config } from "dotenv";
import { Booking } from "./booking/booking.entity"; // Prüfe, ob der Pfad korrekt ist
import { User } from './user/user.entity';

// Lade die ENV-Variablen
config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Booking, User], // Falls du weitere Entities hast, füge sie hier hinzu
  synchronize: false, // Wichtig: Sollte in Produktion immer "false" sein
  migrations: ["dist/migrations/*.js"],
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});
