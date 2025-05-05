<template>
  <div class="max-w-4xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

    <!-- Linke Seite: Formulardaten -->
    <div class="flex flex-col gap-6">
      <!-- 🧭 Titel -->
      <h3 class="text-xl font-semibold text-slate-600 dark:text-slate-300">Buchung starten</h3>

      <!-- 🚗 Anzahl Fahrzeuge -->
      <div class="w-full">
        <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Anzahl Fahrzeuge</label>
        <select
          v-model="numberOfCars"
          class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- 📅 Datepicker -->
      <div class="w-full">
        <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">
          {{ checkInDate ? 'Check-out Datum wählen' : 'Check-in Datum wählen' }}
        </label>

        <div class="relative min-h-[300px]">
          <!-- Check-in -->
          <div v-show="!checkInDate" class="absolute inset-0">
            <Datepicker
              v-model="checkInDate"
              v-bind="checkInProps"
              ref="checkInPickerRef"
            />
          </div>

          <!-- Check-out -->
          <div v-show="checkInDate" class="absolute inset-0">
            <Datepicker
              v-model="selectedRange"
              v-bind="checkOutProps"
              ref="checkOutPickerRef"
              @cleared="resetDates"
            />
          </div>
        </div>
      </div>

      <!-- 💰 Preis -->
      <div class="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded px-4 py-2">
        <p><strong>Grundpreis:</strong> {{ basePriceCHF }} CHF</p>
        <p class="text-xs text-slate-500">(exkl. Kurtaxe)</p>
      </div>

      <!-- ❌ Fehleranzeige -->
      <p v-if="errorMessage" class="text-red-600 text-sm mt-2 text-center">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Rechte Seite: Infobereich / Bildplatzhalter -->
    <div class="hidden md:flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div class="text-slate-400 dark:text-slate-500 p-8 text-center">
        <p class="text-sm">Hier könnte ein Bild, eine Beschreibung oder Slideshow stehen.</p>
      </div>
    </div>
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


const emit = defineEmits<{
  (e: 'next'): void;
}>();


const {
  numberOfCars,
  disabledDates,
  selectedDates,
  errorMessage,
  calculateBasePrice,
  fetchUnavailableDates,
} = useBooking();

const basePriceCHF = computed(() => calculateBasePrice());

const checkInDate = ref<Date | null>(null);
const selectedRange = ref<[Date] | [Date, Date] | null>(null);
const checkOutDate = computed(() =>
  selectedRange.value && selectedRange.value.length === 2 ? selectedRange.value[1] : null
);

const checkInPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);
const checkOutPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);

const { datepickerProps: checkInProps } = useCheckInPicker(disabledDates);
const { selectedRange: rangeFromPicker, datepickerProps: checkOutProps } =
  useCheckOutPicker(checkInDate, disabledDates, 3);

// ⏱️ Synchronisiere Range vom Datepicker mit zentralem State
watch(rangeFromPicker, (val) => {
  selectedRange.value = val;
});

// 📅 Bei Check-in → Check-out vorbereiten + öffnen
watch(checkInDate, (val) => {
  if (val) {
    selectedRange.value = [val];
    nextTick(() => {
      checkOutPickerRef.value?.openMenu();
    });
  }
});

// 📆 Aktualisiere zentralen Datumszustand
watch(selectedRange, (val) => {
  const [start, end] = val || [];
  if (start instanceof Date && end instanceof Date) {
    selectedDates.value = [start, end];
  }
});

// 🚗 Prüfe nach Änderung, ob Range noch verfügbar ist
watch(disabledDates, (newDisabledDates) => {
  if (checkInDate.value && checkOutDate.value) {
    const isAvailable = isDateRangeAvailable(
      checkInDate.value,
      checkOutDate.value,
      newDisabledDates
    );
    if (!isAvailable) resetDates();
  }
});

const applyDates = () => {
  if (checkInDate.value && checkOutDate.value) {
    selectedDates.value = [checkInDate.value, checkOutDate.value];
    emit('next');
  }
};

const resetDates = () => {
  checkInDate.value = null;
  selectedRange.value = null;
};

onMounted(fetchUnavailableDates);
onMounted(() => {
  if (!checkInDate.value && selectedDates.value) {
    const [start, end] = selectedDates.value;
    checkInDate.value = start;
    nextTick(() => {
      selectedRange.value = [start, end];
    });
  }
});


</script>
