import { ref } from 'vue';
import axios from 'axios';
import api from '@/api';
import { format } from 'date-fns';



export interface HostBooking {
  id: number;
  guestName: string;
  spot: number;
  checkIn: string;
  checkOut: string;
  carPlate: string;
  adults: number;
  children: number;
}

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
