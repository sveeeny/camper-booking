// src/types/booking.utils.ts

import type { CreateBookingGuestDto } from '@/types';
import type { BookingState, PriceInfo } from '@/types';

export const emptyGuestInfo: CreateBookingGuestDto = {
  salutation: 'Herr',
  bookingId: '',
  checkInDate: '',
  checkOutDate: '',
  firstName: '',
  lastName: '',
  nationality: '',
  email: '',
  phoneCountryCode: '',
  phoneNumber: '',
  totalPrice: 0,
  source: "guest",
  cars: [],
  
  
};

export const emptyPriceInfo: PriceInfo = {
  base: 0,
  tax: 0,
  total: 0,
};

export const initialBookingState: BookingState = {
  step: 1,
  numberOfCars: 1,
  selectedDates: null,
  bookingId: null,
  cars: [],
  guestInfo: emptyGuestInfo,
  errorFields: [],
  errorMessage: '',
  priceInfo: emptyPriceInfo,
  status: 'draft',
  unavailableDates: [],
  manualPhoneCodeChange: false,
  mode: 'guest',
};
