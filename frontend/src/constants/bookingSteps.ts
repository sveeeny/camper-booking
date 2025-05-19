// 📁 src/constants/bookingSteps.ts
export const bookingSteps = [
  'Zeitraum & Fahrzeug',
  'Gästeinfos',
  'Buchungsübersicht',
  'Zahlung',
] as const;

export type BookingStepLabel = (typeof bookingSteps)[number];
