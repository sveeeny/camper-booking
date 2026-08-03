import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Car } from './cars.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  booking_id: string;  

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

  @Column({ type: 'enum', enum: ['guest', 'host'], default: 'guest' })
  source: 'guest' | 'host';

  @Column({ type: 'text', nullable: true })
  notizen: string;  

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundedAmount: number;

  @Column({ type: 'int', default: 1 })
  numberOfCars: number;

  @Column({ nullable: true })
  createdByIp: string;

  @Column({ type: 'timestamp', nullable: true })
  statusUpdatedAt: Date;

  @Column({ nullable: true })
  cancelReason: string;

  @OneToMany(() => Car, (car) => car.booking, { cascade: true })
  cars: Car[];
}
