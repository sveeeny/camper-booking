import { Controller, Get, Post, Body } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { CreateBookingInfoDto } from './dto/create-booking-info.dto';
import { Booking } from './booking.entity';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  async findAll(): Promise<Booking[]> {
    return this.bookingService.findAll();
  }

  @Post('check')
  async checkAvailability(@Body() createBookingCheckDto: CreateBookingCheckDto) {
    return await this.bookingService.checkAvailability(
      createBookingCheckDto.checkInDate,
      createBookingCheckDto.checkOutDate,
      createBookingCheckDto.numberOfSpots,
    );
  }

  @Post('guest')
  async completeGuestInfo(@Body() createBookingGuestDto: CreateBookingGuestDto) {
    return this.bookingService.completeGuestInfo(createBookingGuestDto);
  }

  @Post('info')
  async completeBooking(@Body() createBookingInfoDto: CreateBookingInfoDto) {
    return this.bookingService.completeBooking(createBookingInfoDto);
  }
}
