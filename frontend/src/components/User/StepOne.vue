<!-- src/components/User/StepOne.vue -->
<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 md:gap-6 md:px-10">
    <!-- 🧭 Titel -->
    <div>
      <p class="text-sm font-medium uppercase tracking-[0.18em] text-blue-300">Online-Buchung</p>
      <h1 class="mt-1 text-2xl font-semibold text-white sm:text-3xl">{{ t('stepOne.title') }}</h1>
    </div>

    <!-- 🚗 Anzahl Fahrzeuge -->
    <div>
      <label class="block text-m font-medium text-slate-300 mb-1">{{ t('stepOne.vehicles') }}</label>
      <select v-model="numberOfCars"
        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
        <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <!-- 📅 Datepicker -->
    <div>
      <label class="block text-m font-medium text-slate-300 mb-1">{{ t('stepOne.maxNights') }}</label>
      <label class="block text-m font-medium text-slate-300 mb-1">
        {{ checkInDate ? 'Check-out Datum wählen' : t('stepOne.chooseCheckIn') }}
      </label>

      <!-- Check-in -->
      <div class="overflow-hidden rounded-lg border border-slate-500 bg-white shadow-sm">
        <div v-show="!checkInDate">
          <Datepicker v-model="checkInDate" v-bind="checkInProps" :dark="isDarkMode" :markers="checkInMarkers"
            actionRow: false ref="checkInPickerRef" teleport-center>
            <template #menu-header>
              <div
                class="w-full px-3 py-2 border-b border-slate/10  text-slate-900 dark:border-white/10 dark:text-slate-100 mx-2 text-m font-semibold text-center">
                {{ t('stepOne.chooseCheckIn') }}
              </div>
            </template>
            <template #action-extra>
              <div class="px-2 pt-2 pb-3 border-t border-slate-600 w-full text-center">
                <button @click="resetDates"
                  class="w-full text-m font-medium text-red-400 bg-slate-600/20 dark:hover:text-red-200 hover:text-red-600 hover:bg-red-600/20 px-4 py-2 mt-1.5 rounded-md transition-all">
                  cancel
                </button>
              </div>
            </template>

          </Datepicker>
        </div>

        <!-- Check-out -->
        <div v-show="checkInDate">
          <Datepicker v-model="selectedRange" v-bind="checkOutProps" :dark="isDarkMode" :markers="checkOutMarkers"
            actionRow: false ref="checkOutPickerRef" @cleared="resetDates" teleport-center>
            <template #menu-header>
              <div
                class="w-full px-3 py-2 border-b border-slate/10  text-slate-900 dark:border-white/10 dark:text-slate-100 mx-2 text-m font-semibold text-center">
                {{ t('stepOne.chooseCheckOut') }}
              </div>
            </template>

            <template #action-extra>
              <div class="px-2 pt-2 pb-3 border-t border-slate-600 w-full text-center">
                <button @click="resetDates"
                  class="w-full text-m font-medium text-red-400 bg-slate-600/20 dark:hover:text-red-200 hover:text-red-600 hover:bg-red-600/20 px-4 py-2 mt-1.5 rounded-md transition-all">
                  cancel
                </button>
              </div>
            </template>

          </Datepicker>
        </div>
      </div>
    </div>

    <!-- 💰 Preis -->
    <div class="w-full rounded-lg border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
      <p><strong>{{ t('stepOne.basePrice') }}:</strong> {{ basePriceCHF }} CHF</p>
      <p class="text-xs text-slate-700 dark:text-slate-200">{{ t('stepOne.excludingTax') }}</p>
    </div>

    <!-- ❌ Fehleranzeige -->
    <p v-if="errorMessage" class="text-red-600 text-sm mt-2 text-center">
      {{ errorMessage }}
    </p>
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

import { useToast } from 'vue-toastification';
const toast = useToast();

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


<style>
.slot-icon {
  height: 20px;
  width: auto;
  cursor: pointer;
}
</style>
