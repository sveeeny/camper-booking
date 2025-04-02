// src/types/booking.d.ts

export interface CreateBookingCheckDto {
    checkInDate: string;    // Format: YYYY-MM-DD
    checkOutDate: string;   // Format: YYYY-MM-DD
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
  }
  
  export interface CreateBookingGuestDto {
    salutation: 'Herr' | 'Frau';
    bookingId: number;
    checkInDate: string;
    checkOutDate: string;
    firstName: string;
    lastName: string;
    nationality: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    totalPrice: number;
    cars: CarsDto[];
  }
  