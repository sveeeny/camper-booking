// src/types/booking.dto.ts

import { BookingStatus } from "./booking.state";


export interface CreateBookingCheckDto {
  checkInDate: string;
  checkOutDate: string;
  numberOfCars: number;
}

export interface CarsDto {
  carPlate: string;
  checkInDate: string;
  checkOutDate: string;
  isCancelled: boolean;
  adults: number;
  children: number;
  touristTax: number;
  basePrice: number;
}

export interface GuestDto {
  salutation: string;
  firstName: string;
  lastName: string;
  nationality: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
}




export interface CreateBookingGuestDto {
  salutation: 'Herr' | 'Frau';
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
  firstName: string;
  lastName: string;
  nationality: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  totalPrice: number;
  source: 'host' | 'guest';
  cars: CarsDto[];
}

export interface StripeCheckoutResponse {
  url: string;
}

export interface BookingStatusResponse {
  status: BookingStatus;
}
