// src/booking/booking-timers.ts

/**
 * Globale Map zum Verwalten aktiver Cleanup-Timer.
 * 
 * Der Key ist die `bookingId` (string),
 * der Value ist das Timer-Objekt (NodeJS.Timeout),
 * das mit `setTimeout(...)` erstellt wurde.
 * 
 * Verwendung:
 * - Timer setzen: cleanupTimers.set(bookingId, timeout)
 * - Timer prüfen: cleanupTimers.has(bookingId)
 * - Timer löschen: clearTimeout(...) + cleanupTimers.delete(bookingId)
 */

export const cleanupTimers = new Map<string, NodeJS.Timeout>();
