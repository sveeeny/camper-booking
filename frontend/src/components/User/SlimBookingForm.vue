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
import { ref } from 'vue';
import BookingStepOne from '@/components/User/BookingStepOne.vue';
import BookingStepTwo from '@/components/User/BookingStepTwo.vue';
import BookingSummary from '@/components/User/BookingSummary.vue';
import BookingTimeline from '@/components/User/BookingTimeline.vue';
import { useBeforeUnload } from '@/composables/useBeforeUnload';
import { useBooking } from '@/composables/useBooking';





// 🛑 Kein überschreiben! props.mode direkt verwenden
const step = ref(1);
const warnOnUnload = ref(true);
useBeforeUnload(warnOnUnload);

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
  if (success) step.value = 2;
};

const handleStepTwoSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) step.value = 3;
};

const handleSummaryConfirm = () => {
  console.log('✅ Buchung bestätigt – weiter zur Zahlung');
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
