// src/utils/isDateRangeAvailable.ts
import { formatDateToYMD } from './dateUtils';

export function isDateRangeAvailable(
  checkIn: Date,
  checkOut: Date,
  disabled: Date[]
): boolean {
  const disabledYMD = disabled.map((d) => formatDateToYMD(d));
  const current = new Date(checkIn);

  while (current < checkOut) {
    const ymd = formatDateToYMD(current);
    if (disabledYMD.includes(ymd)) return false;
    current.setDate(current.getDate() + 1);
  }

  return true;
}
