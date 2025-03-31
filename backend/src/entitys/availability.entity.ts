import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Availability {
  @PrimaryColumn({ type: 'date' })  
  date: string;

  @Column({ type: 'int', default: 0 })
  occupied: number;
}
