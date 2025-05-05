
// src/composables/Host/useHostBookingForm.ts
import { ref, computed } from 'vue';
import { CreateBookingGuestDto, CarsDto } from '@/types/booking';

// 📦 Anzahl Fahrzeuge
const numberOfCars = ref<number>(1);

// 📅 Datumsauswahl
const selectedDates = ref<[Date, Date] | null>(null);
const checkInDate = computed(() => selectedDates.value?.[0] ?? null);
const checkOutDate = computed(() => selectedDates.value?.[1] ?? null);

// 🚗 Fahrzeugdaten
const cars = ref<CarsDto[]>([]);

// 👤 Gastinfos (nur Name & Nationalität sind relevant)
const guestInfo = ref<CreateBookingGuestDto>({
  salutation: 'Herr',
  firstName: 'Max',
  lastName: '',
  nationality: 'CH',
  email: '',
  phoneCountryCode: '+41',
  phoneNumber: '',
  bookingId: 0,
  checkInDate: '',
  checkOutDate: '',
  totalPrice: 0,
  cars: [],
});

// 💰 Preisberechnung
const basePricePerNight = 30;
const manualPrice = ref<number | null>(null);
const discount = ref<number | null>(null);

const basePrice = computed(() => {
  if (!checkInDate.value || !checkOutDate.value) return 0;
  const diff = checkOutDate.value.getTime() - checkInDate.value.getTime();
  const nights = diff / (1000 * 60 * 60 * 24);
  return nights * numberOfCars.value * basePricePerNight;
});

const totalPrice = computed(() => {
  if (manualPrice.value != null && !isNaN(manualPrice.value)) return manualPrice.value;
  if (discount.value != null && !isNaN(discount.value)) {
    return Math.round(basePrice.value * (1 - discount.value / 100));
  }
  return basePrice.value;
});

function setTotalPrice(amount: number) {
  guestInfo.value.totalPrice = amount;
}

export function useHostBookingForm() {
  return {
    numberOfCars,
    selectedDates,
    checkInDate,
    checkOutDate,
    cars,
    guestInfo,
    manualPrice,
    discount,
    basePrice,
    totalPrice,
    setTotalPrice,
  };
}
