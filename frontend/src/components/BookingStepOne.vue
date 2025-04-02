<template>
  <div>
    <h2>Buchung starten</h2>

    <label>Anzahl Fahrzeuge:</label>
    <input type="number" v-model="numberOfCars" min="1" max="5" />

    <label>Wählen Sie Ankunft und Abreise</label>

    <Datepicker
      v-model="selectedDates"
      v-bind="datepickerProps"
    />

    <p><strong>Grundpreis:</strong> CHF {{ basePriceCHF }}</p>
    <button @click="$emit('next')">Weiter</button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useBooking } from '@/composables/useBooking';
import { useDatepicker } from '@/composables/useDatepicker';

const {
  numberOfCars,
  selectedDates,
  disabledDates,
  errorMessage,
  calculateBasePrice,
  fetchUnavailableDates,
} = useBooking();

const basePriceCHF = computed(() => calculateBasePrice());

// 🆕 Datepicker-Logik aus Composable
const { datepickerProps } = useDatepicker(disabledDates, selectedDates);



// 🔄 Wenn sich disabledDates ändern, auch im Datepicker updaten
// watch(disabledDates, (newDates) => {
//   datepickerProps.disabledDates = newDates;
// });

onMounted(fetchUnavailableDates);
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>
