import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
  Res,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';
import { Public } from 'decorators/public.decorator';
import { BookingDatesService } from './booking-dates.service';
import { Response } from 'express';
import { SettingsService } from '@/settings/settings.service';
import { generateBookingPDF } from './booking-pdf.service';
import { verifyDownloadToken } from '@/utils/jwt-download.util';
import { generateDownloadToken } from '@/utils/jwt-download.util';


@Public()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingDatesService: BookingDatesService,
    private readonly settingsService: SettingsService,
  ) { }

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

  @Public()
  @Patch(':id/status')
  async updateStatus(
    @Param('id') bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.bookingService.updateStatus(bookingId, body.status);
  }

  @Public()
  @Get('download-token/:id')
  async getDownloadToken(@Param('id') bookingId: string) {
    console.log('🧪 bookingId received in download-token:', bookingId);
    // Du kannst hier optional prüfen, ob die Buchung existiert
    await this.bookingService.getBookingById(bookingId); // gibt 404 bei ungültiger ID

    const token = generateDownloadToken({ bookingId });
    return { token };
  }

  @Public()
  @Get('pdf-secure')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=Confirmation.pdf')
  async downloadPdfSecure(@Query('token') token: string, @Res() res: Response) {
    if (!token) throw new BadRequestException('Token fehlt');

    let payload: { bookingId: string };
    try {
      payload = verifyDownloadToken(token);
    } catch (err) {
      throw new BadRequestException('Ungültiger oder abgelaufener Token');
    }

    const booking = await this.bookingService.getBookingById(payload.bookingId);
    const settings = await this.settingsService.getSettings();
    const bookingForPdf = {
      ...booking,
      cars: booking.cars.map((car) => ({
        carPlate: car.carPlate,
        adults: car.adults,
        children: car.children,
        priceBase: Number(car.basePrice ?? 0),
        priceTax: Number(car.touristTax ?? 0),
      })),
    };

    const pdfBuffer = await generateBookingPDF(bookingForPdf, settings);
  }

  @Public()
  @Get(':id')
  async getBookingById(@Param('id') bookingId: string) {
    return this.bookingService.getBookingById(bookingId);
  }

  // @Public()
  // @Get('pdf/:bookingId')
  // @Header('Content-Type', 'application/pdf')
  // @Header('Content-Disposition', 'attachment; filename=Confirmation.pdf')
  // async downloadBookingPdf(@Param('bookingId') bookingId: string, @Res() res: Response) {
  //   const booking = await this.bookingService.getBookingById(bookingId);
  //   const settings = await this.settingsService.getSettings();
  //   const pdfBuffer = await generateBookingPDF(booking, settings);

  //   return res.send(pdfBuffer);
  // }

}
