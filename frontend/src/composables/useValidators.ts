// src/composables/useValidators.ts
import type { CreateBookingGuestDto, CarsDto } from '@/types';



export function validateGuestInfo(
  guest: CreateBookingGuestDto,
  cars: CarsDto[],
  mode: 'guest' | 'host' // ✅ ganz normaler String-Parameter
): string[] {
  console.log('🧪 Validierungsmodus:', mode);

  const errors: string[] = [];

  // Name ist Pflicht – immer!
  if (!guest.firstName.trim()) errors.push('Vorname');
  if (!guest.lastName.trim()) errors.push('Nachname');

  if (mode === 'guest') {
    console.log('🧪 Validierung für Gast-Buchung aktiv');

    if (!guest.salutation) errors.push('Anrede');
    if (!guest.email.includes('@')) errors.push('E-Mail');
    if (!guest.nationality) errors.push('Nationalität');
    if (!guest.phoneCountryCode) errors.push('Vorwahl');
    if (guest.phoneNumber.trim().length < 8) errors.push('Telefonnummer');

    cars.forEach((car, i) => {
      if (!car.carPlate.trim()) errors.push(`Autokennzeichen für Auto ${i + 1}`);
      if (car.adults < 1) errors.push(`Erwachsene für Auto ${i + 1}`);
      if (car.children < 0) errors.push(`Kinder für Auto ${i + 1}`);
    });
  }

  return errors;
}
