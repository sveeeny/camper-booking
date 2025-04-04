<!-- src/components/BookingStepOne.vue -->
<template>
  <div>
    <!-- 🚗 Fahrzeuganzahl -->
    <label>Anzahl Fahrzeuge:</label>
    <input type="number" v-model="numberOfCars" min="1" max="5" />

    <!-- 🗓️ Dynamisches Label -->
    <label>{{ checkInDate ? 'Check-out Datum wählen:' : 'Check-in Datum wählen:' }}</label>

    <!-- 📦 Datepicker-Wrapper (Höhe fixiert für sauberen Übergang) -->
    <div class="datepicker-wrapper">
      <!-- 📅 Check-in Datepicker -->
      <div class="datepicker-panel" v-show="!checkInDate">
        <Datepicker
          v-model="checkInDate"
          v-bind="checkInProps"
          ref="checkInPickerRef"
        />
      </div>

      <!-- 📅 Check-out Datepicker -->
      <div class="datepicker-panel" v-show="checkInDate">
        <Datepicker
          v-model="selectedRange"
          v-bind="checkOutProps"
          ref="checkOutPickerRef"
          @cleared="resetDates"
        />
      </div>
    </div>

    <!-- 💰 Preis & Weiter-Button -->
    <p><strong>Grundpreis:</strong> CHF {{ basePriceCHF }}</p>
    <button :disabled="!checkInDate || !checkOutDate" @click="applyDates">Weiter</button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
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

// 📦 Booking-Daten
const {
  numberOfCars,
  disabledDates,
  selectedDates,
  errorMessage,
  calculateBasePrice,
  fetchUnavailableDates,
} = useBooking();

const basePriceCHF = computed(() => calculateBasePrice());

// 🧠 Lokaler Zustand
const checkInDate = ref<Date | null>(null);
const selectedRange = ref<[Date] | [Date, Date] | null>(null);

// 🧠 Computed für Check-out
const checkOutDate = computed(() =>
  selectedRange.value && selectedRange.value.length === 2 ? selectedRange.value[1] : null
);

// 📅 Refs für direkten Zugriff auf Datepicker
const checkInPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);
const checkOutPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);

// 📦 Props generieren
const { datepickerProps: checkInProps } = useCheckInPicker(disabledDates);
const { selectedRange: rangeFromPicker, datepickerProps: checkOutProps } =
  useCheckOutPicker(checkInDate, disabledDates, 3);

// 🔁 Sync Range vom Picker
watch(rangeFromPicker, (val) => {
  selectedRange.value = val;
});

// 📍 Neues Check-in Datum → Reset + Kalender öffnen
watch(checkInDate, (val) => {
  if (val) {
    selectedRange.value = [val];
    nextTick(() => {
      checkOutPickerRef.value?.openMenu();
    });
  }
});

// 🔄💸 Synchronisiere ausgewählten Zeitraum mit zentralem State, sobald beide Datumswerte gesetzt sind
watch(selectedRange, (val) => {
  const [start, end] = val || [];
  if (start instanceof Date && end instanceof Date) {
    selectedDates.value = [start, end];
  }
});

//🚗Bei Änderung der Anzahl Fahrzeuge die gewählten Daten überprüfen
watch(disabledDates, (newDisabledDates) => {
  if (checkInDate.value && checkOutDate.value) {
    const isAvailable = isDateRangeAvailable(
      checkInDate.value,
      checkOutDate.value,
      newDisabledDates
    );

    if (!isAvailable) {
      resetDates();
    }
    // ✅ else: Picker kann neuen maxRange übernehmen
  }
});

// ✅ Weiter zur nächsten Buchungsseite
const applyDates = () => {
  if (checkInDate.value && checkOutDate.value) {
    selectedDates.value = [checkInDate.value, checkOutDate.value];
    emit('next');
  }
};

// ♻️ Alles zurücksetzen
const resetDates = () => {
  checkInDate.value = null;
  selectedRange.value = null;
};

// 📡 Belegte Nächte laden
onMounted(fetchUnavailableDates);
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}

.datepicker-wrapper {
  min-height: 370px;
  position: relative;
  overflow: hidden;
}

.datepicker-panel {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
}
</style>
