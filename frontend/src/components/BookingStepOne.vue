<template>
  <div>
    <h2>Buchung starten</h2>

    <label>Anzahl Fahrzeuge:</label>
    <input type="number" v-model="numberOfCars" min="1" max="5" />

    <label>Wählen Sie Ankunft und Abreise</label>

    <Datepicker
      v-model="selectedDates"
      :format="formatDate"
      :range="{ noDisabledRange: true, minRange: 1, maxRange: 3, showLastInRange: true }"
      :multi-calendars="{ count: 0 }"
      :min-date="new Date()"
      :disabled-dates="disabledDates"
      :enable-time-picker="false"
      :hide-offset-dates="false"
      :prevent-min-max-navigation="true"
      :clearable="false"
      :always-clearable="false"
      :action-row="{ showCancel: true, showPreview: true }"
      placeholder="Check-in & Check-out auswählen"
      auto-apply
    />

    <p><strong>Grundpreis:</strong> CHF {{ basePriceCHF }}</p>
    <button @click="$emit('next')">Weiter</button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useBooking } from '@/composables/useBooking';

// ✨ Formatfunktion mit Typ
const formatDate = (dates: [Date, Date] | Date[] | null): string => {
  if (!Array.isArray(dates) || dates.length !== 2) return '';

  const [checkIn, checkOut] = dates.map((d) =>
    d.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  );

  return checkIn && checkOut ? `${checkIn} – ${checkOut}` : checkIn || '';
};

const {
  numberOfCars,
  selectedDates, // ← ist jetzt korrekt als Date[] getypt in useBooking
  disabledDates,
  errorMessage,
  calculateBasePrice,
  fetchUnavailableDates,
} = useBooking();

const basePriceCHF = computed(() => calculateBasePrice());

onMounted(fetchUnavailableDates);
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>
