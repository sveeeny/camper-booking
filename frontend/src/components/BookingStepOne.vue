<template>
  <div>

    <label>Anzahl Fahrzeuge:</label>
    <input type="number" v-model="numberOfCars" min="1" max="5" />
    <label>{{ checkInDate ? 'Check-out Datum wählen:' : 'Check-in Datum wählen:' }}</label>

       <div class="datepicker-wrapper">
     <!-- 📅 Check-in -->
     <div class="datepicker-panel" v-show="!checkInDate">
       <Datepicker
         v-model="checkInDate"
         v-bind="checkInProps"
         ref="checkInPickerRef"
         
       />
     </div>
   
     <!-- 📅 Check-out -->
     <div class="datepicker-panel" v-show="checkInDate">
       <Datepicker
         v-model="selectedRange"
         v-bind="checkOutProps"
         ref="checkOutPickerRef"
         @cleared="resetDates"
         min-date=""         
       />
     </div>
    </div>

    <p><strong>Grundpreis:</strong> CHF {{ basePriceCHF }}</p>
    <button :disabled="!checkInDate || !checkOutDate" @click="applyDates">
      Weiter
    </button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import { useBooking } from '@/composables/useBooking';
import { useCheckInPicker } from '@/composables/useCheckInPicker';
import { useCheckOutPicker } from '@/composables/useCheckOutPicker';

const emit = defineEmits<{
  (e: 'next'): void;
}>();

const applyDates = () => {
  if (checkInDate.value && checkOutDate.value) {
    selectedDates.value = [checkInDate.value, checkOutDate.value];
    emit('next'); // 👈 Damit der Wechsel zu Step 2 funktioniert
  }
};


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
  selectedRange.value ? selectedRange.value[1] : null
);

const checkOutPickerRef = ref<InstanceType<typeof Datepicker> | null>(null);

const { datepickerProps: checkInProps } = useCheckInPicker(disabledDates);
const { selectedRange: rangeFromPicker, datepickerProps: checkOutProps } =
  useCheckOutPicker(checkInDate, disabledDates, 3);

// Sync `rangeFromPicker` mit `selectedRange`
watch(rangeFromPicker, (val) => {
  selectedRange.value = val;
});

const resetDates = () => {
  checkInDate.value = null;
  selectedRange.value = null;
};


watch(checkInDate, async (val) => {
  if (val) {
    selectedRange.value = [val];
    nextTick(() => {
    checkOutPickerRef.value?.openMenu(); // öffnet den Kalender direkt
  });
  }
});


onMounted(fetchUnavailableDates);
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
.datepicker-wrapper {
  min-height: 370px; /* oder was zu deiner Pickerhöhe passt */
  position: relativ;
  overflow: hidden;
}

.datepicker-panel {
  position: relativ;
  width: 100%;
  top: 0;
  left: 0;
}

</style>
