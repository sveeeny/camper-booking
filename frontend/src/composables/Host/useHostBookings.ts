// src/composables/Host/useHostBookings.ts
import { ref } from 'vue';
import api from '@/api';

// ✅ Zusätzliche Typen für Detailansicht
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
}

// ✅ Haupttyp für Buchungen
export interface HostBooking {
  id: string;
  guestName: string; // Nur für Listenansicht nötig
  spot: number;
  checkIn: string;
  checkOut: string;
  carPlate: string;
  adults: number;
  children: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';

  // Zusätzliche Daten für Detailansicht
  guest?: GuestInfo;
  cars?: CarInfo[];
  priceBase?: number;
  priceTax?: number;
  priceTotal?: number;
}

// 🧠 Haupt-Composable zur Buchungsübersicht
export function useHostBookings() {
  const bookings = ref<HostBooking[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadBookings = async (from: string, to: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/bookings/range', {
        params: { from, to },
      });
      bookings.value = response.data;
    } catch (err) {
      error.value = 'Fehler beim Laden der Buchungen';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  return {
    bookings,
    loading,
    error,
    loadBookings,
  };
}

// 🔍 Detailabruf einer Buchung
export async function fetchBookingById(id: string): Promise<HostBooking | null> {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Laden der Buchung:', error);
    return null;
  }
}

export async function markBookingAsPaid(id: string) {
  try {
    const response = await api.patch(`/bookings/${id}/status`, { status: 'paid' });
    return response.data;
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Buchungsstatus', error);
    throw error;
  }
}
