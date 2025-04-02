// src/composables/useBooking.ts
import { ref, computed, watch } from 'vue';
import axios from '@/api';
import { countries } from '@/countries';
import {
  CreateBookingCheckDto,
  CreateBookingGuestDto,
  CarsDto,
} from '@/types/booking';



const numberOfCars = ref<number>(1);
const selectedDates = ref<[Date, Date] | null>(null);
const cars = ref<CarsDto[]>([]);
const bookingId = ref<number | null>(null);

const guestInfo = ref<CreateBookingGuestDto>({
  salutation: '' as CreateBookingGuestDto['salutation'],
  firstName: '',
  lastName: '',
  nationality: '',
  email: '',
  phoneCountryCode: '',
  phoneNumber: '',
  bookingId: 0,
  checkInDate: '',
  checkOutDate: '',
  totalPrice: 0,
  cars: [],
});

const errorMessage = ref<string>('');
const errorFields = ref<string[]>([]);
const hasSubmitted = ref(false);

const basePricePerNight = 30;
const kurtaxePerAdult = 3;
const kurtaxePerChild = 0;

// const disabledDates = ref<string[]>([]);
const disabledDates = ref<Date[]>([]);
const manualPhoneCodeChange = ref(false);

// Format-Date-Funktion
const formatDateToYMD = (date: Date | string): string =>
  typeof date === 'string' ? date : date.toISOString().split('T')[0];

const checkInDate = computed<Date | null>(() =>
  selectedDates.value ? selectedDates.value[0] : null
);

const checkOutDate = computed<Date | null>(() =>
  selectedDates.value ? selectedDates.value[1] : null
);

// Preisberechnungen
const calculateBasePrice = (): number => {
  if (
    !checkInDate.value || !checkOutDate.value ||
    isNaN(checkInDate.value.getTime()) || isNaN(checkOutDate.value.getTime())
  ) {return 0;}  
  const diff = checkOutDate.value.getTime() - checkInDate.value.getTime();
  const nights = diff / (1000 * 60 * 60 * 24);
  return nights * numberOfCars.value * basePricePerNight;
};

const calculateKurtaxe = (): number => {
  return cars.value.reduce((sum, car) => {
    return sum + car.adults * kurtaxePerAdult + car.children * kurtaxePerChild;
  }, 0);
};

const calculateTotalPrice = (): number => {
  return calculateBasePrice() + calculateKurtaxe();
};

const priceInfo = computed(() => ({
  base: calculateBasePrice(),
  tax: calculateKurtaxe(),
  total: calculateTotalPrice(),
}));

// Nationalität → Ländervorwahl
watch(
  () => guestInfo.value.nationality,
  (newVal) => {
    if (!manualPhoneCodeChange.value) {
      const country = countries.find((c) => c.code === newVal);
      if (country) guestInfo.value.phoneCountryCode = country.dialCode;
    }
  }
);

// 🔄 Anzahl Fahrzeuge → neue belegte Tage laden & Datum ggf. zurücksetzen
watch(numberOfCars, async (newVal) => {
  if (newVal > 0) {
    try {
      const response = await axios.get('/availability/dates', {
        params: { numberOfCars: newVal },
      });

      const dates = response.data.map((entry: { date: string }) => entry.date);
      disabledDates.value = dates;

      if (checkInDate.value && checkOutDate.value) {
        const selectedRange: string[] = [];
        const current = new Date(checkInDate.value);
        const end = new Date(checkOutDate.value);

        while (current < end) {
          selectedRange.push(formatDateToYMD(current));
          current.setDate(current.getDate() + 1);
        }

        const collision = dates.some((date: string) =>
          selectedRange.includes(date)
        );

        if (collision) {
          selectedDates.value = null;
        }
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren der belegten Tage', err); // eslint-disable-line no-console
    }
  }
});

// Validierung Gästeinfos
const validateGuestInfo = (): string[] => {
  const errors: string[] = [];

  if (!guestInfo.value.salutation) errors.push('Anrede');
  if (!guestInfo.value.firstName.trim()) errors.push('Vorname');
  if (!guestInfo.value.lastName.trim()) errors.push('Nachname');
  if (!guestInfo.value.email.includes('@')) errors.push('E-Mail');
  if (!guestInfo.value.nationality) errors.push('Nationalität');
  if (!guestInfo.value.phoneCountryCode) errors.push('Vorwahl');
  if (guestInfo.value.phoneNumber.trim().length < 8)
    errors.push('Telefonnummer');

  cars.value.forEach((car, i) => {
    if (!car.carPlate.trim()) errors.push(`Autokennzeichen für Auto ${i + 1}`);
    if (car.adults < 1) errors.push(`Erwachsene für Auto ${i + 1}`);
    if (car.children < 0) errors.push(`Kinder für Auto ${i + 1}`);
  });

  return errors;
};

watch([guestInfo, cars], () => {
  if (!hasSubmitted.value) return;
  errorFields.value = validateGuestInfo();
}, { deep: true });




const fetchUnavailableDates = async () => {
  const response = await axios.get('/availability/dates', {
    params: { numberOfCars: numberOfCars.value },
  });
  disabledDates.value = response.data.map((entry: { date: string }) => new Date(entry.date));
};



// Step One
const submitBookingStepOne = async (): Promise<boolean> => {
  try {
    if (!selectedDates.value) {
      errorMessage.value = '❌ Bitte wähle ein gültiges Datum.';
      return false;
    }
    const bookingData: CreateBookingCheckDto = {
      checkInDate: formatDateToYMD(selectedDates.value[0]),
      checkOutDate: formatDateToYMD(selectedDates.value[1]),
      numberOfCars: numberOfCars.value,
    };

    const response = await axios.post('/bookings/check', bookingData);

    if (response.data.success && response.data.bookingId) {
      bookingId.value = response.data.bookingId;

      cars.value = Array.from({ length: numberOfCars.value }, () => ({
        carPlate: '',
        adults: 1,
        children: 0,
        isCancelled: false,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        touristTax: 0,
      }));

      guestInfo.value.bookingId = response.data.bookingId;
      guestInfo.value.checkInDate = bookingData.checkInDate;
      guestInfo.value.checkOutDate = bookingData.checkOutDate;

      errorMessage.value = '';
      return true;
    } else {
      errorMessage.value = 'Leider sind keine Stellplätze verfügbar.';
      return false;
    }
  } catch (_) {     
    errorMessage.value = 'Fehler bei der Buchung!';
    return false;
  }
};

// Step Two
const submitBookingStepTwo = async (): Promise<boolean> => {
  hasSubmitted.value = true;
  const errors = validateGuestInfo();
  errorFields.value = errors;

  if (errors.length > 0) {
    errorMessage.value = '❌ Bitte fülle alle Pflichtfelder korrekt aus.';
    return false;
  }

  try {
    // ➤ Saubere Kopie aller Daten zum Senden
    const guestData: CreateBookingGuestDto = {
      ...guestInfo.value,
      totalPrice: calculateTotalPrice(),
      cars: cars.value.map((car) => ({
        ...car,
        touristTax: car.adults * kurtaxePerAdult + car.children * kurtaxePerChild,
      })),
    };

    await axios.post('/bookings/create', guestData);
    return true;
  } catch (_) { 
    errorMessage.value = 'Fehler beim Speichern der Gäste-Informationen!';
    return false;
  }
};


export function useBooking() {
  return {
    numberOfCars,
    selectedDates,
    cars,
    guestInfo,
    errorMessage,
    errorFields,
    bookingId,
    hasSubmitted,
    disabledDates,
    manualPhoneCodeChange,
    checkInDate,
    checkOutDate,
    priceInfo,
    fetchUnavailableDates,
    calculateBasePrice,
    calculateKurtaxe,
    calculateTotalPrice,
    validateGuestInfo,
    submitBookingStepOne,
    submitBookingStepTwo,
  };
}
