<template>
  <div class="summary-container space-y-6">
    <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-white mb-4">
      Buchungsübersicht
    </h2>

    <!-- 🧾 Zeitraum + Gast -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
      <!-- 📅 Zeitraum + Preis -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 h-[280px] flex flex-col justify-center space-y-2 text-sm md:text-base">
        <p><strong>Zeitraum</strong></p>
        <p>Check-in: {{ checkInDateFormatted }} ab {{ checkInTime }} Uhr</p>
        <p>Check-out: {{ checkOutDateFormatted }} bis {{ checkOutTime }} Uhr</p>
        <p>Anzahl Fahrzeuge: {{ numberOfCars }}</p>
        <hr />
        <p><strong>Preisberechnung</strong></p>
        <p>Grundpreis: {{ priceInfo.base }} CHF</p>
        <p>Kurtaxe: {{ priceInfo.tax }} CHF</p>
        <p class="font-semibold">Total: {{ priceInfo.total }} CHF</p>
      </div>

      <!-- 👤 Gastinfo -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 h-[280px] flex flex-col justify-center space-y-2 text-sm md:text-base">
        <p><strong>Gästeinformationen</strong></p>
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
              : 'grid-cols-1 md:grid-cols-5',
    ]">
      <div v-for="(car, index) in cars" :key="index"
        class="bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 h-[180px] text-left">
        <h3 class="font-semibold mb-2">Fahrzeug {{ index + 1 }}</h3>
        <p><strong>KFZ-Nr:</strong> {{ car.carPlate }}</p>
        <p><strong>Erwachsene:</strong> {{ car.adults }}</p>
        <p><strong>Kinder:</strong> {{ car.children }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useBooking } from '@/composables/useBooking';
import { formatToCH } from '@/composables/utils/dateUtils';
import { useSettingsStore } from '@/store/settingsStore';

onMounted(async () => {

});

//settings laden
const settingsStore = useSettingsStore();
const checkInTime = computed(() => settingsStore.settings?.checkInTime ?? '13:00');
const checkOutTime = computed(() => settingsStore.settings?.checkOutTime ?? '12:00');

const {
  checkInDate,
  checkOutDate,
  numberOfCars,
  priceInfo,
  guestInfo,
  cars,
} = useBooking();

const checkInDateFormatted = computed(() => formatToCH(checkInDate.value));
const checkOutDateFormatted = computed(() => formatToCH(checkOutDate.value));
</script>

<style scoped>
.summary-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
