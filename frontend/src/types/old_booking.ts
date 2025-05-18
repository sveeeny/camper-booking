// // src/types/booking.ts

// /**
//  * Buchungs-Check-Daten für Step One.
//  */
// export interface CreateBookingCheckDto {
//   checkInDate: string;    // Format: YYYY-MM-DD
//   checkOutDate: string;   // Format: YYYY-MM-DD
//   numberOfCars: number;
// }

// /**
//  * Fahrzeug-Informationen.
//  */
// export interface CarsDto {
//   carPlate: string;
//   checkInDate: string;
//   checkOutDate: string;
//   isCancelled: boolean;
//   adults: number;
//   children: number;
//   touristTax: number;
// }

// /**
//  * Gästeinfos + finale Buchungsdaten für Step Two.
//  */
// export interface CreateBookingGuestDto {
//   salutation: 'Herr' | 'Frau';
//   bookingId: string;
//   checkInDate: string;
//   checkOutDate: string;
//   firstName: string;
//   lastName: string;
//   nationality: string;
//   email: string;
//   phoneCountryCode: string;
//   phoneNumber: string;
//   totalPrice: number;
//   cars: CarsDto[];
// }

// /**
//  * Preisübersicht.
//  */
// export interface PriceInfo {
//   base: number;   // Grundpreis in CHF
//   tax: number;    // Kurtaxe in CHF
//   total: number;  // Gesamtpreis in CHF (base + tax)
// }

// /**
//  * Buchungsstatus (z. B. für Polling oder Anzeige).
//  */
// export type BookingStatus = 'draft' | 'pending' | 'paid' | 'cancelled';

// /**
//  * Allgemeiner Buchungs-State (für Pinia Store).
//  */
// export interface BookingState {
//   step: number;
//   numberOfCars: number;
//   selectedDates: [Date, Date] | null;
//   bookingId: string | null;
//   cars: CarsDto[];
//   guestInfo: CreateBookingGuestDto;
//   errorFields: string[];
//   errorMessage: string;
//   priceInfo: PriceInfo;
//   status: BookingStatus;
//   unavailableDates: string[];
//   manualPhoneCodeChange: boolean;
//   mode: 'guest' | 'host';
// }

// /**
//  * Antwort für Stripe Checkout (vom Backend).
//  */
// export interface StripeCheckoutResponse {
//   url: string;
// }

// /**
//  * Buchungsstatus-Antwort (z. B. für Polling nach Zahlung).
//  */
// export interface BookingStatusResponse {
//   status: 'paid' | 'pending' | 'cancelled';
// }

// /**
//  * Optional: Typ für API-Fehler (z. B. Axios-Fehler).
//  */
// export interface ApiError {
//   message: string;
//   statusCode?: number;
//   errors?: Record<string, string[]>;
// }

// /**
//  * Initialwert für einen leeren Gast.
//  */
// export const emptyGuestInfo: CreateBookingGuestDto = {
//   salutation: 'Herr',
//   bookingId: '',
//   checkInDate: '',
//   checkOutDate: '',
//   firstName: '',
//   lastName: '',
//   nationality: '',
//   email: '',
//   phoneCountryCode: '',
//   phoneNumber: '',
//   totalPrice: 0,
//   cars: [],
// };

// /**
//  * Initialwert für Preisübersicht.
//  */
// export const emptyPriceInfo: PriceInfo = {
//   base: 0,
//   tax: 0,
//   total: 0,
// };

// /**
//  * Initial-State für den Store.
//  */
// export const initialBookingState: BookingState = {
//   step: 1,
//   numberOfCars: 1,
//   selectedDates: null,
//   bookingId: null,
//   cars: [],
//   guestInfo: emptyGuestInfo,
//   errorFields: [],
//   errorMessage: '',
//   priceInfo: emptyPriceInfo,
//   status: 'draft',
//   unavailableDates: [],
//   manualPhoneCodeChange: false,
//   mode: 'guest',
// };



