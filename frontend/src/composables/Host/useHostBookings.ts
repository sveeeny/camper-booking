// src/composables/Host/useHostBookings.ts
import { ref } from 'vue';
import api from '@/api';
import type {
  HostBookingSummary,
  HostBookingDetailData,
} from '@/types';

// 🧠 Haupt-Composable zur Buchungsübersicht
export function useHostBookings() {
  const bookings = ref<HostBookingSummary[]>([]);
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
export async function fetchBookingById(id: string): Promise<HostBookingDetailData | null> {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Laden der Buchung:', error);
    return null;
  }
}

// 🟢 Status aktualisieren
export async function markBookingAsPaid(id: string) {
  try {
    const response = await api.patch(`/bookings/${id}/status`, { status: 'paid' });
    return response.data;
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Buchungsstatus', error);
    throw error;
  }
}


// 🔄 Buchung aktualisieren
export async function updateBooking(id: string, payload: Partial<HostBookingDetailData>) {
  try {
    const response = await api.patch(`/bookings/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Buchung', error);
    throw error;
  }
}

// 🗑️ Buchung löschen
export async function deleteBookingById(id: string) {
  try {
    await api.delete(`/bookings/${id}`);
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Buchung', error);
    throw error;
  }
}
