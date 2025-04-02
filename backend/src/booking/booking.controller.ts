import { 
  Controller, Get, Post, Body, Param, Delete, BadRequestException, Query 
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';
import { AvailabilityService } from '../availability/availability.service';
import { Public } from 'decorators/public.decorator';

@Public()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly availabilityService: AvailabilityService
  ) {}

  // 🏕 Verfügbarkeit prüfen
  @Public()
  @Post('check')
async checkAvailability(@Body() createBookingCheckDto: CreateBookingCheckDto) {  
  console.log('🔍 Anfrage zur Verfügbarkeitsprüfung erhalten:', {
    ...createBookingCheckDto,
    checkInDate: createBookingCheckDto.checkInDate,
    checkOutDate: createBookingCheckDto.checkOutDate
  }); 
    return this.bookingService.checkAvailability(
        createBookingCheckDto.checkInDate, 
        createBookingCheckDto.checkOutDate, 
        createBookingCheckDto.numberOfCars  
    );
}

  // 📌 NEUE Buchung abschließen und Gästedaten speichern
  @Public()
  @Post('create')
  async createBooking(@Body() createBookingGuestDto: CreateBookingGuestDto) {
    console.log('📥 Gästeinformationen empfangen:', createBookingGuestDto);
    return this.bookingService.createBooking(createBookingGuestDto);
  }

  // 📆 Kalenderansicht der Verfügbarkeit
  @Public()
  @Get('calendar')
  async getCalendarView(@Query('year') year: number) {
    console.log(`📆 Kalenderdaten für ${year} abrufen...`);
    if (!year) {
      throw new BadRequestException('Ein gültiges Jahr muss angegeben werden.');
    }
    return this.availabilityService.getAvailabilityForYear(year);
  }

  // 🗑 Buchung stornieren
  @Public()
  @Delete(':id')
  async cancelBooking(@Param('id') bookingId: number, @Query('year') year: number) {
    console.log(`🗑 Storniere Buchung ${bookingId} für das Jahr ${year}`);
    if (!year) {
      throw new BadRequestException('Ein gültiges Jahr muss angegeben werden.');
    }
    return this.bookingService.deleteBooking(bookingId, year);
  }
}
