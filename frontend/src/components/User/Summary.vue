<template>
  <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-white">
      {{ t('summary.title') }}
    </h2>

    <!-- 👤 Gastinfo + 📅 Zeitraum -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <!-- 👤 Gastinfo -->
      <div class="bg-white dark:bg-slate-600 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 space-y-1">
        <p class="font-semibold mb-2">{{ t('summary.guestInfo.title') }}</p>
        <p>{{ t('summary.guestInfo.salutation') }}: {{ guestInfo.salutation }}</p>
        <p>{{ t('summary.guestInfo.name') }}: {{ guestInfo.firstName }} {{ guestInfo.lastName }}</p>
        <p>{{ t('summary.guestInfo.nationality') }}: {{ guestInfo.nationality }}</p>
        <p>{{ t('summary.guestInfo.email') }}: {{ guestInfo.email }}</p>
        <p>{{ t('summary.guestInfo.phone') }}: {{ guestInfo.phoneCountryCode }} {{ guestInfo.phoneNumber }}</p>
      </div>

      <!-- 📅 Zeitraum + Preis -->
      <div class="bg-white dark:bg-slate-600 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 space-y-1">
        <p class="font-semibold mb-2">{{ t('summary.period.title') }}</p>
        <p>{{ t('summary.period.checkin', { date: checkInDateFormatted, time: checkInTime }) }}</p>
        <p>{{ t('summary.period.checkout', { date: checkOutDateFormatted, time: checkOutTime }) }}</p>
        <p>{{ t('summary.period.vehicles', { count: numberOfCars }) }}</p>
      </div>
    </div>

    <!-- 🚐 Fahrzeuge -->
    <div :class="[
      'grid gap-4',
      cars.length === 1 ? 'grid-cols-1' :
      cars.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
      cars.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
      cars.length === 4 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-5'
    ]">
      <div
        v-for="(car, index) in cars"
        :key="index"
        class="bg-white dark:bg-slate-600 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 space-y-1 text-left"
      >
        <p class="font-semibold mb-2">{{ t('summary.car.title', { index: index + 1 }) }}</p>
        <p><strong>{{ t('summary.car.plate') }}</strong> {{ car.carPlate }}</p>
        <p><strong>{{ t('summary.car.adults') }}</strong> {{ car.adults }}</p>
        <p><strong>{{ t('summary.car.children') }}</strong> {{ car.children }}</p>
        <p><strong>{{ t('summary.car.basePrice') }}</strong> CHF {{ (car.basePrice ?? 0).toFixed(2) }}</p>
        <p><strong>{{ t('summary.car.tax') }}</strong> CHF {{ (car.touristTax ?? 0).toFixed(2) }}</p>
      </div>
    </div>

    <!-- 💰 Gesamtpreis -->
    <div class="bg-white dark:bg-slate-600 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 text-center font-semibold text-lg">
      {{ t('summary.total.label', { price: (priceInfo.total ?? 0).toFixed(2) }) }}
    </div>
  </div>
</template>



<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useBooking } from '@/composables/useBooking';
import { formatToCH } from '@/composables/utils/dateUtils';
import { useSettingsStore } from '@/store/settingsStore';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();

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
