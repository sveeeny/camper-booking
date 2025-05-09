import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';
import { Public } from 'decorators/public.decorator';
import { BookingDatesService } from './booking-dates.service';


@Public()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingDatesService: BookingDatesService) { }

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
  async cancelBooking(@Param('id') bookingId: string) {
    return this.bookingService.deleteBooking(bookingId);
  }

  @Public()
  @Get('range')
  async getBookingsInRange(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.bookingService.getBookingsInRange(from, to);
  }
  @Public()
  @Patch(':id/update')
  async updateBookingDatesAndCars(
    @Param('id') bookingId: string,
    @Body() dto: CreateBookingCheckDto,
  ) {
    return this.bookingDatesService.updateBookingDatesAndCars(bookingId, dto);
  }

  @Public()
  @Get(':id/status')
  async getBookingStatus(@Param('id') bookingId: string) {
    return this.bookingService.getBookingStatus(bookingId);
  }

  // In booking.controller.ts
  @Public()
  @Patch(':id/status')
  async updateStatus(
    @Param('id') bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.bookingService.updateStatus(bookingId, body.status);
  }


}
