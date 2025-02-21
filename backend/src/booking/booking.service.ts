import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  findAll(): Promise<Booking[]> {
    return this.bookingRepository.find();
  }

  create(booking: Booking): Promise<Booking> {
    return this.bookingRepository.save(booking);
  }
}
