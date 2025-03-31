// src/composables/useBooking.js
import { ref, computed, watch } from 'vue';
import axios from '@/api'
import { countries } from '@/countries';

const numberOfCars = ref(1);
const selectedDates = ref([]);
const cars = ref([]);
const bookingId = ref(null);

const guestInfo = ref({
  salutation: '',
  firstName: '',
  lastName: '',
  nationality: '',
  email: '',
  phoneCountryCode: '',
  phoneNumber: '',
});

const errorMessage = ref('');
const errorFields = ref([]);
const hasSubmitted = ref(false);

const basePricePerNight = 30;
const kurtaxePerAdult = 3;
const kurtaxePerChild = 0;

const disabledDates = ref([]);

const fetchUnavailableDates = async () => {
  try {
    const response = await axios.get('/availability/dates', {
      params: { numberOfCars: numberOfCars.value },
    });
    disabledDates.value = response.data.map(entry => new Date(entry.date));
  } catch (error) {
    console.error('❌ Fehler beim Laden der belegten Tage:', error);
  }
};


const checkInDate = computed(() => selectedDates.value[0] ? new Date(selectedDates.value[0]) : null);
const checkOutDate = computed(() => selectedDates.value[1] ? new Date(selectedDates.value[1]) : null);


const calculateBasePrice = () => {
  if (!checkInDate.value || !checkOutDate.value) return 0;
  const diff = checkOutDate.value - checkInDate.value;
  const nights = diff / (1000 * 60 * 60 * 24);
  return nights * numberOfCars.value * basePricePerNight;
};

const calculateKurtaxe = () => {
  return cars.value.reduce((sum, car) => {
    return sum + (car.adults * kurtaxePerAdult) + (car.children * kurtaxePerChild);
  }, 0);
};

const calculateTotalPrice = () => {
  return calculateBasePrice() + calculateKurtaxe();
};

const priceInfo = computed(() => ({
  base: calculateBasePrice(),
  tax: calculateKurtaxe(),
  total: calculateTotalPrice()
}));

const manualPhoneCodeChange = ref(false);

watch(() => guestInfo.value.nationality, (newVal) => {
  if (!manualPhoneCodeChange.value) {
    const country = countries.find(c => c.code === newVal);
    if (country) {
      guestInfo.value.phoneCountryCode = country.dialCode;
    }
  }
});




const validateGuestInfo = () => {
  const errors = [];

  if (!guestInfo.value.salutation) errors.push("Anrede");
  if (!guestInfo.value.firstName.trim()) errors.push("Vorname");
  if (!guestInfo.value.lastName.trim()) errors.push("Nachname");
  if (!guestInfo.value.email.includes("@")) errors.push("E-Mail");
  if (!guestInfo.value.nationality) errors.push("Nationalität");
  if (!guestInfo.value.phoneCountryCode) errors.push("Vorwahl");
  if (guestInfo.value.phoneNumber.trim().length < 8) errors.push("Telefonnummer");

  cars.value.forEach((car, index) => {
    if (!car.carPlate.trim()) errors.push(`Autokennzeichen für Auto ${index + 1}`);
    if (car.adults < 1) errors.push(`Erwachsene für Auto ${index + 1}`);
    if (car.children < 0) errors.push(`Kinder für Auto ${index + 1}`);
  });

  return errors;
};

watch(
  () => ({ ...guestInfo.value, cars: cars.value }),
  () => {
    if (!hasSubmitted.value) return;
    errorFields.value = validateGuestInfo();
  },
  { deep: true }
);


const submitBookingStepOne = async () => {
  try {
    const bookingData = {
      checkInDate: selectedDates.value[0],
      checkOutDate: selectedDates.value[1],
      numberOfCars: numberOfCars.value,
    };

    const response = await axios.post('/bookings/check', bookingData);

    if (response.data.success && response.data.bookingId) {
      bookingId.value = response.data.bookingId;
      cars.value = Array.from({ length: numberOfCars.value }, () => ({
        carPlate: '',
        adults: 1,
        children: 0
      }));
      errorMessage.value = '';
      return true;
    } else {
      errorMessage.value = 'Leider sind keine Stellplätze verfügbar.';
      return false;
    }
  } catch (error) {
    errorMessage.value = 'Fehler bei der Buchung!';
    return false;
  }
};

const submitBookingStepTwo = async () => {
  hasSubmitted.value = true;
  const errors = validateGuestInfo();
  errorFields.value = errors;

  if (errors.length > 0) {
    errorMessage.value = "❌ Bitte fülle alle Pflichtfelder korrekt aus.";
    return false;
  }

  try {
    const guestData = {
      bookingId: bookingId.value,
      checkInDate: checkInDate.value,
      checkOutDate: checkOutDate.value,
      ...guestInfo.value,
      totalPrice: calculateTotalPrice(),
      cars: cars.value.map(car => ({
        ...car,
        isCancelled: false,
        checkInDate: checkInDate.value,
        checkOutDate: checkOutDate.value,
        touristTax: car.adults * kurtaxePerAdult + car.children * kurtaxePerChild
      }))
    };

    await axios.post('/bookings/create', guestData);
    return true;
  } catch (error) {
    errorMessage.value = 'Fehler beim Speichern der Gäste-Informationen!';
    return false;
  }
};

export function useBooking() {
  return {
    // State
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

    // Computed
    checkInDate,
    checkOutDate,
    priceInfo,
    
    // Methoden
    fetchUnavailableDates,
    calculateBasePrice,
    calculateKurtaxe,
    calculateTotalPrice,
    validateGuestInfo,
    submitBookingStepOne,
    submitBookingStepTwo,
  };
}
