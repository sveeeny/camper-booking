export interface BookingPdfInput {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  spot: number | null;

  guestName: string;
  guest: GuestInfo;
  cars: CarInfo[];
  priceTotal: number;
}

export interface GuestInfo {
  salutation: string;
  firstName: string;
  lastName: string;
  nationality: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
}

export interface CarInfo {
  carPlate: string;
  adults: number;
  children: number;
  priceBase: number;
  priceTax: number;
  
}
