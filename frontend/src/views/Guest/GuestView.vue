<template>
  <header class="flex justify-end items-center p-4">
    <LanguageSwitcher />
  </header>
  <div class="booking-form">
    <!-- 🧭 Step 1: Zeitraum & Fahrzeug -->
    <StepOne v-if="step === 1" @next="handleStepOneSubmit" />

    <!-- 👤 Step 2: Gästeinfos -->
    <StepTwo v-else-if="step === 2" @submit="handleStepTwoSubmit" />

    <!-- 📋 Step 3: Zusammenfassung -->
    <Summary v-else-if="step === 3" @confirm="handleSummaryConfirm" />
  </div>

  <!-- 📍 Timeline-Navigation -->
  <Timeline :step="stepIndex" :can-proceed="true" @next="handleNext" @prev="step--" @confirm="handleSummaryConfirm" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/api';

import StepOne from '@/components/User/StepOne.vue';
import StepTwo from '@/components/User/StepTwo.vue';
import Summary from '@/components/User/Summary.vue';
import Timeline from '@/components/User/Timeline.vue';
import { useBookingCleanup } from '@/composables/useBookingCleanup';


import { useBooking } from '@/composables/useBooking';
import { bookingStepKeys } from '@/constants/bookingSteps';
import { useUserStore } from '@/store/userStore';
import { onBeforeUnmount } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

import LanguageSwitcher from '@/components/User/LanguageSwitcher.vue';
import { useI18n } from 'vue-i18n';


import { useBookingStore } from '@/store/bookingStore';
import { storeToRefs } from 'pinia';
import api from '@/api';


const pingBookingTimer = async () => {
    if (!bookingId.value) return;

    try {
      await api.patch(`/bookings/${bookingId.value}/timer-reset`);
      console.log('⏱️ Timer verlängert');
    } catch (err) {
      console.warn('⚠️ Timer-Reset fehlgeschlagen:', err);
    }
  };

const bookingStore = useBookingStore();
const {step} = storeToRefs(bookingStore);



const { locale } = useI18n();
const {t} = useI18n();

const settingsStore = useSettingsStore();


const stepIndex = computed(() => step.value - 1);
const maxStep = bookingStepKeys.length;

const showPaymentOverlay = ref(false);
const overlayStatus = ref<'processing' | 'cancelled'>('processing');
const warnOnUnload = ref(true);


const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

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
} = useBooking();


useBookingCleanup({ requireConfirmation: true });


onMounted(async () => {
  if (!settingsStore.settings) {
    settingsStore.fetchSettings().then(() => {
      console.log('✅ Settings geladen:', settingsStore.settings);
    });
  }
  initModeFromUser();

  const paymentActive = localStorage.getItem('paymentInProgress') === 'true';

  if (paymentActive) {
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
        bookingId.value = parsed.bookingId;
        bookingStore.setStep(parsed.step || 1);
        console.log('⚠️ Buchung aus localStorage geladen (nach abgebrochener Zahlung)');
      } catch (e) {
        console.error('❌ Fehler beim Parsen von pendingBooking:', e);
      }
    }

    // ✅ Cleanup vorbereiten: localStorage zurücksetzen
    localStorage.removeItem('pendingBooking');
    localStorage.setItem('paymentInProgress', 'false');

    alert('Die Zahlung wurde abgebrochen. Deine Buchung ist noch nicht abgeschlossen.');
    step.value = 3;
  }
});


const handleStepOneSubmit = async () => {
  const success = await submitBookingStepOne();
  if (success) {
    bookingStore.setStep(2);
    pingBookingTimer();
  }

};

const handleStepTwoSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) {
    bookingStore.setStep(3);
    pingBookingTimer();
  }

};

const handleSummaryConfirm = async () => {
  console.log('✅ Buchung bestätigt – weiter zur Zahlung');
  if (userStore.role === 'host' || userStore.role === 'admin') {
    // Status auf "cash" setzen
    await axios.patch(`/bookings/${bookingId.value}/status`, {
      status: 'cash'
    });

    router.push('/success');
    return;
  }


  const bookingDataToPersist = {
    step: step.value,
    selectedDates: selectedDates.value,
    numberOfCars: numberOfCars.value,
    cars: cars.value,
    guestInfo: guestInfo.value,
    bookingId: bookingId.value,
  };

  localStorage.setItem('pendingBooking', JSON.stringify(bookingDataToPersist));
  localStorage.setItem('paymentInProgress', 'true');

  warnOnUnload.value = false;

  pingBookingTimer();
  
  try {
    const amountInRappen = Math.round(priceInfo.value.total * 100);
    const response = await axios.post('/stripe/checkout', {
      amount: amountInRappen,
      bookingId: bookingId.value,
      productName: t('stripe.productName'),
      locale: locale.value,
    });

    await axios.patch(`/bookings/${bookingId.value}/status`, {
      status: 'pending'
    });

    window.location.href = response.data.url;

  } catch (error) {
    console.error('❌ Fehler beim Stripe Checkout:', error);
    alert('Die Zahlung konnte nicht gestartet werden.');
  }
};

const handleNext = async () => {
  if (step.value === 1) await handleStepOneSubmit();
  else if (step.value === 2) await handleStepTwoSubmit();
  else if (step.value < maxStep) bookingStore.setStep(step.value + 1);
};
</script>

<style scoped>
.booking-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>
