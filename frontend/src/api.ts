import axios, { AxiosResponse } from 'axios';
import type {
  CreateBookingCheckDto,
  CreateBookingGuestDto,
} from './types/booking';


const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

// 🔁 Rückgabetypen
export type CheckAvailabilityResponse = {
  success: boolean;
  bookingId?: number;
  message?: string;
};

export type CreateBookingResponse = {
  message: string;
  bookingId: number;
};

// 🔍 Verfügbarkeit prüfen
export const checkAvailability = async (
  data: CreateBookingCheckDto
): Promise<AxiosResponse<CheckAvailabilityResponse>> => {
  return api.post('/bookings/check', data);
};

// 🧾 Gästedaten übermitteln
export const submitGuestInfo = async (
  data: CreateBookingGuestDto
): Promise<AxiosResponse<CreateBookingResponse>> => {
  return api.post('/bookings/create', data);
};

// 📆 Belegte Tage abrufen
export const getUnavailableDates = async (
  numberOfCars: number
): Promise<AxiosResponse<{ date: string }[]>> => {
  return api.get('/availability/dates', {
    params: { numberOfCars },
  });
};

export default api;
