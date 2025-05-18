// src/entities/settings.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'settings' })
export class Settings {
    @PrimaryColumn({ default: 'singleton' })
    id: string = 'singleton';

    @Column({ type: 'decimal', default: 2 })
    adultTax: number;

    @Column({ type: 'decimal', default: 0 })
    childTax: number;

    @Column({ type: 'decimal', default: 30 })
    pricePerNightPerCar: number;

    @Column({ type: 'int', default: 5 })
    maxGuestsPerCar: number;

    @Column({ type: 'int', default: 180 })
    bookingAdvanceDays: number;

    @Column({ type: 'int', default: 1 })
    minNights: number;

    @Column({ type: 'int', default: 30 })
    maxNights: number;

    @Column({ type: 'varchar', default: '13:00' })
    checkInTime: string;

    @Column({ type: 'varchar', default: '12:00' })
    checkOutTime: string;

    @Column({ type: 'int', default: 7 })
    cancellationWindow: number;

    @Column({ type: 'decimal', default: 20 })
    cancellationFee: number;
}
