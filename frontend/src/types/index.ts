// src/types/index.ts

// 📦 DTOs: API-Datenstrukturen
export type {
  CreateBookingCheckDto,
  CreateBookingGuestDto,
  CarsDto,
  StripeCheckoutResponse,
  BookingStatusResponse,
} from './booking.dto';

// 📦 Zustand & Status
export type {
  BookingStatus,
  BookingState,
  PriceInfo,
} from './booking.state';

// 📦 Initialwerte & Defaults
export {
  emptyGuestInfo,
  emptyPriceInfo,
  initialBookingState,
} from './booking.utils';

// 📦 Fehlerobjekte
export type { ApiError } from './errors';


// 📦 Host-spezifische Typen
export type {
  HostBookingSummary,
  HostBookingDetailData,
} from './host.types';
