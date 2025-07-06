<!-- src/components/User/StepOne.vue -->
<template>
  <div class="flex flex-col gap-6">
      <!-- 🧭 Titel -->
      <h3 class="text-xl font-semibold text-slate-200">{{ t('stepOne.title') }}</h3>

      <!-- 🚗 Anzahl Fahrzeuge -->
      <div>
        <label class="block mb-1 font-medium text-slate-400">{{ t('stepOne.vehicles') }}</label>
        <select v-model="numberOfCars" class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-500">
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- 📅 Datepicker -->
      <div>
        <label class="block mb-1 font-medium text-slate-400">{{ t('stepOne.maxNights') }}</label>
        <label class="block mb-1 font-medium text-slate-400">
          {{ checkInDate ? 'Check-out Datum wählen' : t('stepOne.chooseCheckIn') }}
        </label>

        <div class="relative min-h-[300px]">
          <!-- Check-in -->
          <div v-show="!checkInDate" class="absolute inset-0">
            <Datepicker 
            v-model="checkInDate" 
            v-bind="checkInProps" 
            :dark="isDarkMode"
            :markers="checkInMarkers" 
            ref="checkInPickerRef" />
          </div>

          <!-- Check-out -->
          <div v-show="checkInDate" class="absolute inset-0">
            <Datepicker
              v-model="selectedRange"
              v-bind="checkOutProps"
              :dark="isDarkMode"
              :markers="checkOutMarkers"
              ref="checkOutPickerRef"
              @cleared="resetDates"
            />
          </div>
        </div>
      </div>

      <!-- 💰 Preis -->
      <div class="w-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded px-4 py-2">
        <p><strong>{{ t('stepOne.basePrice') }}:</strong> {{ basePriceCHF }} CHF</p>
        <p class="text-xs text-slate-700 dark:text-slate-200">{{ t('stepOne.excludingTax') }}</p>
      </div>

      <!-- ❌ Fehleranzeige -->
      <p v-if="errorMessage" class="text-red-600 text-sm mt-2 text-center">
        {{ errorMessage }}
      </p>
    </div>
  <div class="max-w-4xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Linke Seite: Formulardaten -->
    

    <!-- Rechte Seite: Platz für Medien -->
    <!-- <div class="hidden md:flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div class="text-slate-400 dark:text-slate-500 p-8 text-center">
        <p class="text-sm">Hier könnte ein Bild, eine Beschreibung oder Slideshow stehen.</p>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import { useBooking } from '@/composables/useBooking';
import { useCheckInPicker } from '@/composables/useCheckInPicker';
import { useCheckOutPicker } from '@/composables/useCheckOutPicker';
import { isDateRangeAvailable } from '@/composables/utils/isDateRangeAvailable';
import { useI18n } from 'vue-i18n';
import { useDarkMode } from '@/composables/utils/useDarkMode';

const { isDarkMode } = useDarkMode();


const { t } = useI18n();

const emit = defineEmits<{
  (e: 'next'): void;
}>();

// 📦 Zentrale Buchungslogik
const {
  numberOfCars,
  selectedDates,
  errorMessage,
  unavailableDatesAsDates,
  fetchUnavailableDates,
  calculateBasePrice,
} = useBooking();

const basePriceCHF = computed(() => calculateBasePrice());

// 📅 Datepicker-Setup
const checkInDate = ref<Date | null>(null);
const selectedRange = ref<[Date] | [Date, Date] | null>(null);
const checkOutDate = computed(() => selectedRange.value?.[1] ?? null);

// ⌨️ Refs für Kalendersteuerung
const checkInPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);
const checkOutPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);

// 🧠 Picker-Logik
const { datepickerProps: checkInProps, markers: checkInMarkers } = useCheckInPicker(unavailableDatesAsDates);
const {
  selectedRange: rangeFromPicker,
  datepickerProps: checkOutProps,
  markers: checkOutMarkers,
} = useCheckOutPicker(checkInDate, unavailableDatesAsDates);

// 🔁 Reaktivität
watch(rangeFromPicker, (val) => selectedRange.value = val);

watch(checkInDate, (val) => {
  if (val) {
    selectedRange.value = [val];
    nextTick(() => checkOutPickerRef.value?.openMenu());
  }
});

watch(selectedRange, (val) => {
  const [start, end] = val || [];
  if (start instanceof Date && end instanceof Date) {
    selectedDates.value = [start, end];
  }
});

watch(unavailableDatesAsDates, (newDisabled) => {
  if (checkInDate.value && checkOutDate.value) {
    const isAvailable = isDateRangeAvailable(checkInDate.value, checkOutDate.value, newDisabled);
    if (!isAvailable) resetDates();
  }
});

watch(numberOfCars, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    await fetchUnavailableDates();
    if (selectedDates.value) {
      const [start, end] = selectedDates.value;
      const stillAvailable = isDateRangeAvailable(start, end, unavailableDatesAsDates.value);
      if (!stillAvailable) resetDates();
    }
  }
});

const resetDates = () => {
  checkInDate.value = null;
  selectedRange.value = null;
};

onMounted(fetchUnavailableDates);

// 🔄 Wiederherstellen (z. B. bei Stripe-Abbruch)
onMounted(() => {
  if (!checkInDate.value && selectedDates.value) {
    const [start, end] = selectedDates.value;
    checkInDate.value = start;
    nextTick(() => selectedRange.value = [start, end]);
  }
});
</script>
