import type { BookingStatus, CarsDto } from '@/types';
import type { GuestDto } from './booking.dto';

export interface HostBookingSummary {
  id: string;
  guestName: string;
  spot: number;
  checkIn: string;
  checkOut: string;
  carPlate: string;
  adults: number;
  children: number;
  status: BookingStatus; // oder BookingStatus, falls importiert
}


export interface HostBookingDetailData {
  id: string;
  checkIn: string;
  checkOut: string;
  priceTotal: number;
  status: BookingStatus;
  createdAt: string;
  statusUpdatedAt: string | null;
  source: 'guest' | 'host';
  guest: GuestDto;
  cars: CarsDto[];
}
