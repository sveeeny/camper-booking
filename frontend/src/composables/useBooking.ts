// src/composables/useBooking.ts

import { storeToRefs } from 'pinia';
import { useBookingStore } from '@/store/bookingStore';
import axios from '@/api';
import { parseYMDStringToLocalDate, formatDateLocalYMD, normalizeDate } from '@/composables/utils/dateUtils';
import { computed } from 'vue';
import { validateGuestInfo } from './useValidators';
import type {
  CreateBookingCheckDto,
  CreateBookingGuestDto,
  StripeCheckoutResponse,
} from '@/types/booking';

export function useBooking() {
  const bookingStore = useBookingStore();
  const {
    numberOfCars,
    selectedDates,
    bookingId,
    cars,
    guestInfo,
    errorFields,
    errorMessage,
    priceInfo,
    status,
    unavailableDates,
    mode,
  } = storeToRefs(bookingStore);

  const checkInDate = computed(() => selectedDates.value?.[0] ?? null);
  const checkOutDate = computed(() => selectedDates.value?.[1] ?? null);

  const initModeFromUser = () => {
    bookingStore.initModeFromUser();
  };


  const unavailableDatesAsDates = computed(() =>
    unavailableDates.value.map(parseYMDStringToLocalDate)
  );


  /**
   * Preisberechnung: Kurtaxe
   */
  const calculateKurtaxe = () => {
    if (!bookingStore.selectedDates) return 0;

    const checkIn = normalizeDate(bookingStore.selectedDates[0]);
    const checkOut = normalizeDate(bookingStore.selectedDates[1]);

    const totalNights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    const totalPeople = bookingStore.cars.reduce((sum, car) => sum + car.adults + car.children, 0);

    return totalNights * totalPeople * 2; // 2 CHF pro Person/Nacht
  };

  /**
   * Preisberechnung: Basispreis
   */
  const calculateBasePrice = (): number => {
    if (!bookingStore.selectedDates) return 0;
    const checkIn = normalizeDate(bookingStore.selectedDates[0]);
    const checkOut = normalizeDate(bookingStore.selectedDates[1]);
    const totalNights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    return totalNights * numberOfCars.value * 30; // z. B. 25 CHF pro Fahrzeug/Nacht
  };

  /**
   * Preisberechnung: Total
   */
  const calculateTotalPrice = (): number => {
    return calculateBasePrice() + calculateKurtaxe();
  };

  /**
   * Verfügbarkeit abrufen (z. B. belegte Daten)
   */
  const fetchUnavailableDates = async () => {
    try {
      const response = await axios.get<{ date: string }[]>('/availability/dates', {
        params: { numberOfCars: numberOfCars.value },
      });

      const dateStrings = response.data.map((entry) => entry.date);
      bookingStore.setUnavailableDates(dateStrings);

      console.log('✅ Unavailable dates gespeichert:', dateStrings);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Verfügbarkeiten:', error);
    }
  };




  /**
   * Step One absenden (Check-Daten)
   */
  const submitBookingStepOne = async (): Promise<boolean> => {
    if (!selectedDates.value) {
      bookingStore.setErrorMessage('Bitte ein gültiges Datum wählen.');
      return false;
    }

    const payload: CreateBookingCheckDto = {
      checkInDate: formatDateLocalYMD(normalizeDate(selectedDates.value[0])),
      checkOutDate: formatDateLocalYMD(normalizeDate(selectedDates.value[1])),

      numberOfCars: numberOfCars.value,
    };

    // 🧩 Fall 1: Keine Buchung vorhanden → Standardablauf
    if (!bookingId.value) {
      try {
        const response = await axios.post('/bookings/check', payload);
        console.log('✅ Neue Buchung erstellt:', response.data);

        bookingStore.setBookingId(response.data.bookingId);
        bookingStore.setCars(response.data.cars ?? []);

        if (!response.data.cars || response.data.cars.length === 0) {
          bookingStore.initEmptyCars(payload.checkInDate, payload.checkOutDate);
        }

        bookingStore.setPriceInfo({
          base: calculateBasePrice(),
          tax: calculateKurtaxe(),
          total: calculateTotalPrice(),
        });

        bookingStore.setStatus('draft');
        bookingStore.setErrorMessage('');
        return true;
      } catch (error) {
        console.error('❌ Fehler bei neuer Buchung:', error);
        bookingStore.setErrorMessage('Fehler beim Prüfen der Buchung.');
        return false;
      }
    }

    // 🧩 Fall 2: Buchung existiert → Status prüfen & PATCH
    try {
      const statusResponse = await axios.get(`/bookings/${bookingId.value}/status`);
      const status = statusResponse.data.status;

      if (status === 'paid') {
        bookingStore.setErrorMessage('Diese Buchung wurde bereits bezahlt und kann nicht mehr geändert werden.');
        return false;
      }
      bookingStore.setStatus(status);


      // 🔄 Buchung per PATCH aktualisieren
      const patchResponse = await axios.patch(`/bookings/${bookingId.value}/update`, payload);
      console.log('✅ Bestehende Buchung aktualisiert:', patchResponse.data);

      bookingStore.setCars(patchResponse.data.cars ?? []);

      if (!patchResponse.data.cars || patchResponse.data.cars.length === 0) {
        bookingStore.initEmptyCars(payload.checkInDate, payload.checkOutDate);
      }

      bookingStore.setPriceInfo({
        base: calculateBasePrice(),
        tax: calculateKurtaxe(),
        total: calculateTotalPrice(),
      });

      bookingStore.setStatus('draft');
      bookingStore.setErrorMessage('');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Buchung:', error);
      bookingStore.setErrorMessage('Die Buchung konnte nicht aktualisiert werden.');
      return false;
    }
  };




  /**
   * Step Two absenden (Gästeinfos + finale Buchung)
   */


  const submitBookingStepTwo = async (): Promise<boolean> => {
    if (!bookingId.value || !selectedDates.value) {
      bookingStore.setErrorMessage('Keine gültige Buchung gefunden.');
      return false;
    }

    // 🧩 Platzhalter für fehlende Hostdaten setzen
    if (mode.value === 'host') {
      if (!guestInfo.value.firstName.trim()) guestInfo.value.firstName = 'Gast';
      if (!guestInfo.value.lastName.trim()) guestInfo.value.lastName = 'Unbekannt';
      if (!guestInfo.value.salutation) guestInfo.value.salutation = 'Herr';
      if (!guestInfo.value.email.trim()) guestInfo.value.email = 'keine-angabe@example.com';
      if (!guestInfo.value.phoneNumber.trim()) guestInfo.value.phoneNumber = '0000000000';
      if (!guestInfo.value.phoneCountryCode) guestInfo.value.phoneCountryCode = '+41';
      if (!guestInfo.value.nationality) guestInfo.value.nationality = 'CH';

      cars.value.forEach((car, i) => {
        if (!car.carPlate.trim()) car.carPlate = `XX-${i + 1}`;
        if (car.adults < 1) car.adults = 1;
        if (car.children < 0) car.children = 0;
      });
    }

    // 🧪 Validieren
    const errors = validateGuestInfo(guestInfo.value, cars.value, mode.value);
    if (errors.length > 0) {
      bookingStore.setErrorFields(errors);
      bookingStore.setErrorMessage('Bitte alle Pflichtfelder korrekt ausfüllen.');
      return false;
    }

    // ✅ Fehlerzustand zurücksetzen
    bookingStore.setErrorFields([]);
    bookingStore.setErrorMessage('');

    const payload: CreateBookingGuestDto = {
      ...guestInfo.value,
      bookingId: bookingId.value,
      checkInDate: formatDateLocalYMD(normalizeDate(selectedDates.value[0])),
      checkOutDate: formatDateLocalYMD(normalizeDate(selectedDates.value[1])),

      totalPrice: priceInfo.value.total,
      cars: cars.value,
    };

    try {
      const response = await axios.post('/bookings/create', payload);
      console.log('✅ Buchung Schritt 2 erfolgreich:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Fehler in Schritt 2:', error);
      bookingStore.setErrorMessage('Fehler beim Speichern der Buchung.');
      return false;
    }
  };



  return {
    // 💰 Preisfunktionen
    calculateBasePrice,
    calculateKurtaxe,
    calculateTotalPrice,

    // 📅 Datenlogik
    fetchUnavailableDates,

    // 🧾 API-Aktionen
    submitBookingStepOne,
    submitBookingStepTwo,

    // 🧩 Store Refs (optional für direkte Nutzung)
    numberOfCars,
    selectedDates,
    bookingId,
    cars,
    guestInfo,
    errorFields,
    errorMessage,
    priceInfo,
    status,
    unavailableDates,
    unavailableDatesAsDates,
    checkInDate,
    checkOutDate,
    initModeFromUser,
    mode,
  };
}
