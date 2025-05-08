<template>
  <div class="booking-summary space-y-6">

    <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-white mb-4">Buchungsübersicht</h2>


    <!-- Grid für die 3 Hauptboxen -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">

      <!-- 🗓️ Zeitraum + Kosten-->
      <div
        class="info-container bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 h-[280px] flex flex-col justify-center space-y-2 text-sm md:text-base">
        <p><strong>Zeitraum</strong></p>
        <p>Check-in: {{ checkInDateFormatted }} ab 13:00 Uhr</p>
        <p>Check-out: {{ checkOutDateFormatted }} bis 12:00 Uhr</p>
        <p>Anzahl Fahrzeuge: {{ numberOfCars }}</p>
        <hr>
        
        <p><strong>Preisberechnung</strong></p>
        <p>Grundpreis: {{ priceInfo.base }} CHF</p>
        <p>Kurtaxe: {{ priceInfo.tax }} CHF</p>
        <p class="font-semibold">Total: CHF {{ priceInfo.total }} </p>
      
      </div>


      <!-- 👤 Gast -->
      <div
        class="guest-container bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 h-[280px] flex flex-col justify-center space-y-2 text-sm md:text-base">
        <h3 class="font-semibold text-base mb-1">Gästeinformationen</h3>
        <p>Anrede: {{ guestInfo.salutation }}</p>
        <p>Name: {{ guestInfo.firstName }} {{ guestInfo.lastName }}</p>
        <p>Nationalität: {{ guestInfo.nationality }}</p>
        <p>E-Mail: {{ guestInfo.email }}</p>
        <p>Telefon: {{ guestInfo.phoneCountryCode }} {{ guestInfo.phoneNumber }}</p>
      </div>

    </div>

    <!-- 🚐 Fahrzeuge -->
    <div :class="[
      'grid gap-3',
      cars.length === 1
        ? 'grid-cols-1'
        : cars.length === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : cars.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : cars.length === 4
              ? 'grid-cols-1 md:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-5'
    ]">
      <div v-for="(car, index) in cars" :key="index"
        class="car-container bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 h-[180px] text-left">
        <h3 class="font-semibold mb-2">Fahrzeug {{ index + 1 }}</h3>
        <p><strong>KFZ-Nr:</strong> {{ car.carPlate }}</p>
        <p><strong>Erwachsene:</strong> {{ car.adults }}</p>
        <p><strong>Kinder:</strong> {{ car.children }}</p>
      </div>
    </div>


  </div>
</template>


<script setup lang="ts">
import { useBooking } from '@/composables/useBooking';
import { computed } from 'vue';

const {
  checkInDate,
  checkOutDate,
  numberOfCars,
  priceInfo,
  guestInfo,
  cars,
} = useBooking();

const formatDate = (date: Date | null) =>
  date
    ? date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '–';

const checkInDateFormatted = computed(() => formatDate(checkInDate.value));
const checkOutDateFormatted = computed(() => formatDate(checkOutDate.value));
</script>

<style scoped>
.booking-summary {
  max-width: 800px;
  margin: 0 auto;
}

.total {
  font-weight: bold;
  margin-top: 5px;
}
</style>