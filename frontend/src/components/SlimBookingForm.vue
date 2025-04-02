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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BookingStepOne from './BookingStepOne.vue';
import BookingStepTwo from './BookingStepTwo.vue';
import { useBooking } from '@/composables/useBooking';
import type { CarsDto, CreateBookingGuestDto } from '@/types/booking';

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
  if (success) step.value = 2;
};

const handleStepTwoSubmit = async () => {
  await submitBookingStepTwo();
  step.value = 1; // zurücksetzen nach erfolgreicher Buchung
};
</script>

<style scoped>
.booking-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>
