<template>
  <!-- 💳 Overlay bei Stripe-Zahlung -->
  <BookingOverlay v-if="showPaymentOverlay" :status="overlayStatus" />

  <div class="booking-form">
    <!-- 🧭 Step 1: Zeitraum & Fahrzeug -->
    <BookingStepOne v-if="step === 1" @next="handleStepOneSubmit" />

    <!-- 👤 Step 2: Gästeinfos -->
    <BookingStepTwo v-else-if="step === 2" @submit="handleStepTwoSubmit" />

    <!-- 📋 Step 3: Zusammenfassung -->
    <BookingSummary v-else-if="step === 3" @confirm="handleSummaryConfirm" />
  </div>

  <!-- 📍 Timeline-Navigation -->
  <BookingTimeline :step="stepIndex" :can-proceed="true" @next="handleNext" @prev="step--"
    @confirm="handleSummaryConfirm" />
</template>




<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import router from '@/router';
import axios from '@/api';

import BookingStepOne from '@/components/User/BookingStepOne.vue';
import BookingStepTwo from '@/components/User/BookingStepTwo.vue';
import BookingSummary from '@/components/User/BookingSummary.vue';
import BookingTimeline from '@/components/User/BookingTimeline.vue';
import BookingOverlay from './BookingOverlay.vue';

import { useBeforeUnload } from '@/composables/useBeforeUnload';
import { useBooking } from '@/composables/useBooking';
import { bookingSteps } from '@/constants/bookingSteps';
import { useBookingStore } from '@/store/bookingStore';

import { useUserStore } from '@/store/userStore';
const userStore = useUserStore();

const step = ref(1);
const stepIndex = computed(() => step.value - 1);
const maxStep = bookingSteps.length;

const showPaymentOverlay = ref(false);
const overlayStatus = ref<'processing' | 'cancelled'>('processing');


const warnOnUnload = ref(true);
const { removeBeforeUnload } = useBeforeUnload(warnOnUnload);



// Zugriff auf den zentralen Booking-Store via Composable
const {
  numberOfCars,
  selectedDates,
  checkInDate,
  checkOutDate,
  bookingId,
  cars,
  guestInfo,
  errorFields,
  errorMessage,
  priceInfo,
  submitBookingStepOne,
  submitBookingStepTwo,
  initModeFromUser,
  mode,
} = useBooking();

// Prüfung bei Ladevorgang (z. B. bei Stripe-Abbruch)
onMounted(async () => {
  const route = useRoute();

  initModeFromUser();

  // 🧩 Wiederherstellen, falls Buchung nach Abbruch fortgesetzt wird
  const saved = localStorage.getItem('pendingBooking');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.selectedDates?.length === 2) {
        selectedDates.value = [
          new Date(parsed.selectedDates[0]),
          new Date(parsed.selectedDates[1])
        ];
      }
      numberOfCars.value = parsed.numberOfCars;
      cars.value = parsed.cars;
      guestInfo.value = parsed.guestInfo;
      priceInfo.value = parsed.priceInfo;
      bookingId.value = parsed.bookingId;
      step.value = parsed.step || 1;
      console.log('⚠️ localStorage gelöscht');
    } catch (e) {
      console.error('❌ Fehler beim Parsen von pendingBooking:', e);
      localStorage.removeItem('pendingBooking');
    }
  }

  // ⛔ Abbruch → Status auf "cancelled" setzen
  if (route.query.payment === 'cancelled' && bookingId.value) {
    try {
      await axios.patch(`/bookings/${bookingId.value}/status`, {
        status: 'cancelled'
      });
      console.log('⚠️ Status auf "cancelled" gesetzt');
    } catch (err) {
      console.error('❌ Fehler beim Setzen von Status "cancelled":', err);
    }

    step.value = 3;
    alert('Die Zahlung wurde abgebrochen. Deine Buchung ist noch nicht abgeschlossen.');
  }
});



const handleStepOneSubmit = async () => {
  const success = await submitBookingStepOne();
  if (success) step.value = 2;
};

const handleStepTwoSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) step.value = 3;
};

const handleSummaryConfirm = async () => {
  console.log('✅ Buchung bestätigt – weiter zur Zahlung');
  if (userStore.role === 'host' || userStore.role === 'admin') {
    console.log('✅ Host-Buchung abgeschlossen (ohne Zahlung)');
    // Evtl. Status direkt auf "paid" setzen
    // await axios.patch(`/bookings/${bookingId.value}/status`, { status: 'paid' });
    router.push('/success'); // oder Host-spezifische Bestätigung
    return;
  }

  // 🧩 Lokale Buchung sichern
  const bookingDataToPersist = {
    step: step.value,
    selectedDates: selectedDates.value,
    numberOfCars: numberOfCars.value,
    cars: cars.value,
    guestInfo: guestInfo.value,
    priceInfo: priceInfo.value,
    bookingId: bookingId.value,
  };

  localStorage.setItem('pendingBooking', JSON.stringify(bookingDataToPersist));

  warnOnUnload.value = false;
  removeBeforeUnload();

  try {
    const amountInRappen = priceInfo.value.total * 100;
    const response = await axios.post('/stripe/checkout', {
      amount: amountInRappen,
      bookingId: bookingId.value,
    });

    //Status auf pending setzen
    await axios.patch(`/bookings/${bookingId.value}/status`, {
      status: 'pending'
    });

    // 🆕 Redirect im selben Tab
    window.location.href = response.data.url;

  } catch (error) {
    console.error('❌ Fehler beim Stripe Checkout:', error);
    alert('Die Zahlung konnte nicht gestartet werden.');
  }
};


// zentrale Weiter-Schaltfläche
const handleNext = async () => {
  if (step.value === 1) {
    await handleStepOneSubmit();
  } else if (step.value === 2) {
    await handleStepTwoSubmit();
  } else if (step.value < maxStep) {
    step.value++;
  }
};
</script>


<style scoped>
.booking-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>
