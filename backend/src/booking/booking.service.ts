import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { CreateBookingCheckDto } from './dto/create-booking-check.dto';
import { CreateBookingGuestDto } from './dto/create-booking-guest.dto';
import { CreateBookingInfoDto } from './dto/create-booking-info.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find();
  }

  async create(createBookingCheckDto: CreateBookingCheckDto): Promise<Booking> {
    const newBooking = this.bookingRepository.create({
      checkInDate: createBookingCheckDto.checkInDate,
      checkOutDate: createBookingCheckDto.checkOutDate,
      numberOfSpots: createBookingCheckDto.numberOfSpots,
    });

    return await this.bookingRepository.save(newBooking);
  }

  async completeGuestInfo(createBookingGuestDto: CreateBookingGuestDto): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: createBookingGuestDto.bookingId },
    });
  
    if (!booking) {
      throw new BadRequestException('Buchung nicht gefunden.');
    }
  
    // ✅ Neue Felder speichern
    booking.firstName = createBookingGuestDto.firstName;
    booking.lastName = createBookingGuestDto.lastName;
  
    return this.bookingRepository.save(booking);
  }
  

  async completeBooking(createBookingInfoDto: CreateBookingInfoDto): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: createBookingInfoDto.bookingId }, // Suche nach ID statt checkInDate
    });

    if (!booking) {
      throw new BadRequestException('Buchung nicht gefunden.');
    }

    booking.paymentConfirmed = createBookingInfoDto.paymentConfirmed;
    return this.bookingRepository.save(booking);
  }
  
async checkAvailability(checkInDate: string, checkOutDate: string, numberOfSpots: number): Promise<{ assignedSpots: number[]; bookingId: number }> {
  const overlappingBookings = await this.bookingRepository
    .createQueryBuilder("booking")
    .where("booking.checkInDate < :checkOutDate AND booking.checkOutDate > :checkInDate", {
      checkInDate,
      checkOutDate,
    })
    .getMany();

  // Berechne belegte Stellplätze
  const bookedSpots = overlappingBookings.flatMap(booking => booking.assignedSpots || []);
  console.log("📌 Bereits belegte Stellplätze:", bookedSpots);

  // Alle möglichen Stellplätze (1-5)
  const allSpots = [1, 2, 3, 4, 5];

  // Finde freie Stellplätze
  const availableSpots = allSpots.filter(spot => !bookedSpots.includes(spot));
  console.log("✅ Verfügbare Stellplätze:", availableSpots);

  if (availableSpots.length < numberOfSpots) {
    return { assignedSpots: [], bookingId: 0 }; // 0 bedeutet "keine Buchung erstellt"
  }

  // Weist dem Nutzer zusammenhängende Stellplätze zu
  const assignedSpots = availableSpots.slice(0, numberOfSpots);
  console.log("➡️ Zugewiesene Stellplätze:", assignedSpots);

  // Speichere Buchung mit zugewiesenen Stellplätzen
  const newBooking = this.bookingRepository.create({
    checkInDate,
    checkOutDate,
    numberOfSpots,
    assignedSpots,
  });

  const savedBooking = await this.bookingRepository.save(newBooking);
  console.log("✅ Buchung gespeichert mit ID:", savedBooking.id);

  return { assignedSpots, bookingId: savedBooking.id };
}

  
}
