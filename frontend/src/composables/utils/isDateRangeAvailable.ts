// src/utils/isDateRangeAvailable.ts
import { formatDateToYMD } from './dateUtils';

export function isDateRangeAvailable(
  checkIn: Date,
  checkOut: Date,
  disabled: Date[]
): boolean {
  // 🛠 Alle Disabled-Daten ins YMD-Format
  const disabledYMD = disabled.map(formatDateToYMD);

  const current = new Date(checkIn);

  // Prüfe jede Nacht bis zur Nacht vor dem Check-out
  while (current < checkOut) {
    const ymd = formatDateToYMD(current);
    if (disabledYMD.includes(ymd)) {
      return false;
    }
    current.setDate(current.getDate() + 1);
  }

  return true;
}
