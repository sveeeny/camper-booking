// src/composables/useBooking.ts

// Wichtig: mode (guest | host) wird erst innerhalb von useBooking() verwendet!

import { ref, computed, watch } from 'vue';
import axios from '@/api';
import { countries } from '@/countries';
import {
  CreateBookingCheckDto,
  CreateBookingGuestDto,
  CarsDto,
} from '@/types/booking';
import { parseYMDStringToLocalDate } from './utils/dateUtils';
import { validateGuestInfo } from '@/composables/useValidators';
import { useUserStore } from '@/store/userStore';

const lastSavedCheckInDate = ref<string | null>(null);
const lastSavedCheckOutDate = ref<string | null>(null);
const lastSavedNumberOfCars = ref<number | null>(null);

const numberOfCars = ref<number>(1);
const selectedDates = ref<[Date, Date] | null>(null);
const cars = ref<CarsDto[]>([]);
const bookingId = ref<string | null>(null);

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
  ) { return 0; }


  const nights = Math.floor(
    (Date.UTC(
      checkOutDate.value.getFullYear(),
      checkOutDate.value.getMonth(),
      checkOutDate.value.getDate()
    ) -
      Date.UTC(
        checkInDate.value.getFullYear(),
        checkInDate.value.getMonth(),
        checkInDate.value.getDate()
      )) /
    (1000 * 60 * 60 * 24)
  );

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

// In useBooking.ts hinzufügen:

const cancelIncompleteBookingIfNeeded = async () => {
  if (bookingId.value) {
    try {
      await axios.delete(`/bookings/${bookingId.value}`);
      console.log(`❌ Unvollständige Buchung ${bookingId.value} wurde gelöscht.`);
    } catch (err) {
      console.error('Fehler beim Löschen der Buchung:', err);
    }
  }
};



const fetchUnavailableDates = async () => {
  try {
    const response = await axios.get('/availability/dates', {
      params: { numberOfCars: numberOfCars.value },
    });

    const dates = response.data.map((entry: { date: string }) =>
      parseYMDStringToLocalDate(entry.date)
    );
    disabledDates.value = dates;

    // ❌ Ggf. Auswahl zurücksetzen, wenn Kollision mit neuer Verfügbarkeit
    if (checkInDate.value && checkOutDate.value) {
      const selectedRange: string[] = [];
      const current = new Date((checkInDate.value));
      const end = new Date(checkOutDate.value);


      while (current < end) {
        selectedRange.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 1);
      }

      const unavailableStrings = dates.map(formatDateToYMD);
      const collision = unavailableStrings.some((d: string) =>
        selectedRange.includes(d)
      );

      if (collision) {
        selectedDates.value = null;
      }
    }
  } catch (err) {
    console.error('Fehler beim Aktualisieren der belegten Tage', err); // eslint-disable-line no-console
  }
};


watch(numberOfCars, fetchUnavailableDates);

const createEmptyCars = (count: number, checkIn: string, checkOut: string) => {
  return Array.from({ length: count }, () => ({
    carPlate: '',
    adults: 1,
    children: 0,
    isCancelled: false,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    touristTax: 0,
  }));
};


// Step One
const submitBookingStepOne = async (): Promise<boolean> => {
  try {
    if (!selectedDates.value) {
      errorMessage.value = '❌ Bitte wähle ein gültiges Datum.';
      return false;
    }


    if (bookingId.value) {
      console.log('🔄 Vorhandene Buchung erkannt:', bookingId.value);

      const bookingData: CreateBookingCheckDto = {
        checkInDate: formatDateToYMD(selectedDates.value[0]),
        checkOutDate: formatDateToYMD(selectedDates.value[1]),
        numberOfCars: numberOfCars.value,
      };

      const hasDateChanged =
        bookingData.checkInDate !== lastSavedCheckInDate.value ||
        bookingData.checkOutDate !== lastSavedCheckOutDate.value;

      const hasCarsChanged =
        bookingData.numberOfCars !== lastSavedNumberOfCars.value;

      if (!hasDateChanged && !hasCarsChanged) {
        console.log('✅ Keine Änderung – alles bleibt wie es ist.');
        return true;
      }

      console.log('🛠 Änderungen erkannt – sende Update.');
      await axios.patch(`/bookings/${bookingId.value}/update`, bookingData);

      cars.value = createEmptyCars(bookingData.numberOfCars, bookingData.checkInDate, bookingData.checkOutDate);

      // Snapshots aktualisieren:
      lastSavedCheckInDate.value = bookingData.checkInDate;
      lastSavedCheckOutDate.value = bookingData.checkOutDate;
      lastSavedNumberOfCars.value = bookingData.numberOfCars;

      return true;
    }


    const bookingData: CreateBookingCheckDto = {

      checkInDate: formatDateToYMD(selectedDates.value[0]),
      checkOutDate: formatDateToYMD(selectedDates.value[1]),
      numberOfCars: numberOfCars.value,
    };

    const response = await axios.post('/bookings/check', bookingData);

    if (response.data.success && response.data.bookingId) {
      bookingId.value = response.data.bookingId;

      cars.value = createEmptyCars(bookingData.numberOfCars, bookingData.checkInDate, bookingData.checkOutDate);

      guestInfo.value.bookingId = response.data.bookingId;
      guestInfo.value.checkInDate = bookingData.checkInDate;
      guestInfo.value.checkOutDate = bookingData.checkOutDate;

      lastSavedCheckInDate.value = bookingData.checkInDate;
      lastSavedCheckOutDate.value = bookingData.checkOutDate;
      lastSavedNumberOfCars.value = bookingData.numberOfCars;

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


const resetBookingState = () => {
  numberOfCars.value = 1;
  selectedDates.value = null;
  cars.value = [];
  bookingId.value = null;

  guestInfo.value = {
    salutation: 'Herr',
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
  };

  errorMessage.value = '';
  errorFields.value = [];
  hasSubmitted.value = false;

  // Optional: auch die Snapshots für Check-in/out resetten, wenn du sie verwendest:
  if (typeof lastSavedCheckInDate !== 'undefined') lastSavedCheckInDate.value = null;
  if (typeof lastSavedCheckOutDate !== 'undefined') lastSavedCheckOutDate.value = null;
  if (typeof lastSavedNumberOfCars !== 'undefined') lastSavedNumberOfCars.value = null;
};



export function useBooking() {
  const userStore = useUserStore();
  const mode: 'guest' | 'host' = userStore.isHost ? 'host' : 'guest';

  console.log('🚀 useBooking() gestartet mit mode:', mode);
  const validateGuestInfoLocal = (): string[] => {
    return validateGuestInfo(guestInfo.value, cars.value, mode);
  };

  watch([guestInfo, cars], () => {
    if (!hasSubmitted.value) return;
    errorFields.value = validateGuestInfoLocal();
  }, { deep: true });

  const submitBookingStepTwo = async (): Promise<boolean> => {
    hasSubmitted.value = true;
    const errors = validateGuestInfoLocal();
    errorFields.value = errors;

    if (errors.length > 0) {
      errorMessage.value = '❌ Bitte fülle alle Pflichtfelder korrekt aus.';
      return false;
    }

    try {
      if (mode === 'host') {
        // 🧪 Nur für manuelle Host-Buchungen: sinnvolle Default-Werte setzen
        guestInfo.value.salutation ||= 'Herr';
        guestInfo.value.email ||= 'host@example.com';
        guestInfo.value.nationality ||= 'NA';
        guestInfo.value.phoneCountryCode ||= '+41';
        guestInfo.value.phoneNumber ||= '00000000';

        cars.value.forEach((car, index) => {
          car.carPlate ||= `HOST-${index + 1}`;
          car.adults ||= 1;
          car.children ||= 0;
        });
      }

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
    submitBookingStepOne,
    submitBookingStepTwo,
    cancelIncompleteBookingIfNeeded,
    resetBookingState,
  };
}

