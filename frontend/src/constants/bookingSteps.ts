// 📁 src/constants/bookingSteps.ts
export const bookingSteps = [
  'Zeitraum & Fahrzeug',
  'Gästeinfos & Insassen',
  'Buchungsübersicht',
  'Zahlung',
] as const;

export type BookingStepLabel = (typeof bookingSteps)[number];
