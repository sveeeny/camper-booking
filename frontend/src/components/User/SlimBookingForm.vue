<template>



  <div class="booking-form">
    <BookingStepOne
      v-if="step === 1"
      v-model:numberOfCars="numberOfCars"
      v-model:dates="selectedDates"
      :error-message="errorMessage"
      @next="handleStepOneSubmit"
    />

    <BookingStepTwo
      v-else-if="step === 2"
      :check-in="checkInDate"
      :check-out="checkOutDate"
      :number-of-cars="numberOfCars"
      v-model:cars="cars"
      v-model:guest="guestInfo"
      :error-fields="errorFields"
      :price-info="priceInfo"
      @submit="handleStepTwoSubmit"
    />

    <BookingSummary
      v-else-if="step === 3"
      @confirm="handleSummaryConfirm"
    />

  </div>

  
  <BookingTimeline
  :step="step - 1"
  :can-proceed="true"
  @next="handleNext"
  @prev="step--"
/>




</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BookingStepOne from '@/components/User/BookingStepOne.vue';
import BookingStepTwo from '@/components/User/BookingStepTwo.vue';
import { useBooking } from '@/composables/useBooking';
import BookingSummary from '@/components/User/BookingSummary.vue';
import type { CarsDto, CreateBookingGuestDto } from '@/types/booking';
import { useBeforeUnload } from '@/composables/useBeforeUnload';
import BookingTimeline from '@/components/User/BookingTimeline.vue';



const warnOnUnload = ref(true); // z. B. true während Eingabe, false nach Abschluss
useBeforeUnload(warnOnUnload);

const step = ref<number>(1);

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
} = useBooking();

const handleStepOneSubmit = async () => {
  const success = await submitBookingStepOne();
  console.log('Submit-Ergebnis Step One:', success); // ⬅️ neu
  if (success) step.value = 2;
};

const handleStepTwoSubmit = async () => {
  const success = await submitBookingStepTwo();
  console.log('Submit-Ergebnis Step Two:', success); // ⬅️ neu
  if (success) step.value = 3;
};

const handleSummaryConfirm = () => {
  // z. B. Stripe-Zahlung starten, oder weiterleiten
  console.log('✅ Buchung bestätigt – weiter zur Zahlung');
  // z. B. window.location.href = '/payment'
};



const handleNext = async () => {
  if (step.value === 1) {
    await handleStepOneSubmit();
  } else if (step.value === 2) {
    await handleStepTwoSubmit();
  } else {
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
