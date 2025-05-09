import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  car_id: string;  
  @Column()
  car_slot: number; 

  @Column()
  carPlate: string;

  @Column({ type: 'date' })
  checkInDate: string;

  @Column({ type: 'date' })
  checkOutDate: string;

  @Column({ default: false })
  isCancelled: boolean;

  @Column({ type: 'int', default: 1 })
  adults: number;

  @Column({ type: 'int', default: 0 })
  children: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  touristTax: number;

  @ManyToOne(() => Booking, (booking) => booking.cars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column()
  booking_id: string; 
}
