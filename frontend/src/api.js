import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000", // Falls keine ENV-Variable gesetzt ist, auf localhost zurückfallen
});

export const getBookings = async () => {
  return api.get("/bookings");
};

export const checkAvailability = async (bookingData) => {
  return api.post("/bookings/check", bookingData);
};

export const submitGuestInfo = async (guestData) => {
  return api.post("/bookings/guest", guestData);
};

export const completeBooking = async (bookingInfo) => {
  return api.post("/bookings/info", bookingInfo);
};

export const getUnavailableDates = async () => {
  return api.get("/availability/dates");
};


export default api;
