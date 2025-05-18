// src/types/booking.state.ts

import type { CreateBookingGuestDto, CarsDto } from '@/types';

export type BookingStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'cash';

export interface PriceInfo {
  base: number;
  tax: number;
  total: number;
}

export interface BookingState {
  step: number;
  numberOfCars: number;
  selectedDates: [Date, Date] | null;
  bookingId: string | null;
  cars: CarsDto[];
  guestInfo: CreateBookingGuestDto;
  errorFields: string[];
  errorMessage: string;
  priceInfo: PriceInfo;
  status: BookingStatus;
  unavailableDates: string[];
  manualPhoneCodeChange: boolean;
  mode: 'guest' | 'host';
}
