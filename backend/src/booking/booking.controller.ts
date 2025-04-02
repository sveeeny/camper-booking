import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';
import { Public } from 'decorators/public.decorator';

@Public()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // 🏕 Verfügbarkeit prüfen (provisorische Reservierung)
  @Public()
  @Post('check')
  async checkAvailability(@Body() dto: CreateBookingCheckDto) {
    return this.bookingService.checkAvailability(
      dto.checkInDate,
      dto.checkOutDate,
      dto.numberOfCars
    );
  }

  // 📌 Neue Buchung abschließen
  @Public()
  @Post('create')
  async createBooking(@Body() dto: CreateBookingGuestDto) {
    return this.bookingService.createBooking(dto);
  }

  // ❌ Buchung stornieren und löschen
  @Public()
  @Delete(':id')
  async cancelBooking(@Param('id') bookingId: number) {
    return this.bookingService.deleteBooking(bookingId);
  }
}
