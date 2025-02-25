import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  salutation: string; // Herr, Frau


  @Column({ type: 'date' })
  checkInDate: string;

  @Column({ type: 'date' })
  checkOutDate: string;

  @Column({ default: false }) // Standardmäßig nicht bezahlt
  paymentConfirmed: boolean;

  @Column({ nullable: false, default: 1 })
  numberOfSpots: number;

  @Column({ type: 'text', nullable: true }) // Optional für besondere Wünsche
  specialRequests?: string;

  @Column({ type: 'int', nullable: true }) // Anzahl Gäste wird später ergänzt
  numberOfGuests?: number;
  
  @Column("simple-array", { nullable: false })
  assignedSpots: number[];

  @Column({ nullable: true })
  warningMessage?: string;

  @Column("text", { array: true, nullable: true }) // ✅ Autokennzeichen-Liste speicherbar
  carPlates?: string[];

  @Column({ nullable: true }) // ✅ E-Mail darf nicht fehlen!
  email?: string;

  @Column({ nullable: true }) // ✅ Vorwahl als optional
  phoneCountryCode?: string;

  @Column({ nullable: true }) // ✅ Telefonnummer kann leer sein
  phoneNumber?: string;

  @Column({ nullable: true }) // ✅ Nationalität als Dropdown
  nationality?: string;
}
