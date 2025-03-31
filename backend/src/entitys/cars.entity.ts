import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Car {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  booking_id: string; 

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

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00 }) 
  touristTax: number;
}
