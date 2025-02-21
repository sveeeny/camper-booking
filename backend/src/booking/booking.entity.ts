import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  checkInDate: string;

  @Column()
  checkOutDate: string;

  @Column()
  numberOfGuests: number;
}
