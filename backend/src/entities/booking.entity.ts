// src/bookings/entities/booking.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Car } from './cars.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  booking_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  salutation: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  phoneCountryCode: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: false })
  paymentConfirmed: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundedAmount: number;

  @Column({ type: 'int', default: 1 })
  numberOfCars: number;

  @OneToMany(() => Car, (car) => car.booking, { cascade: true })
  cars: Car[];

}
