import { Controller, Get, Post, Body } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Booking } from './booking.entity';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findAll(): Promise<Booking[]> {
    return this.bookingService.findAll();
  }

  @Post()
  create(@Body() booking: Booking): Promise<Booking> {
    return this.bookingService.create(booking);
  }
}
