import type { BookingStatus, CarsDto } from '@/types';

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
  priceTotal: number;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;

  guest: {
    salutation: string;
    firstName: string;
    lastName: string;
    nationality: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
  };

  cars: CarsDto[];
}
