<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Buchungen</h2>

    <!-- 📅 Datumsauswahl -->
    <!-- 📅 Heute-Button -->
    <button @click="selectToday" class="mt-2 text-sm text-blue-600 hover:underline">
      Heute auswählen
    </button>

    <div class="mb-4">
      <Datepicker 
        v-model="selectedDate" 
        placeholder="Datum wählen" 
        :format="formatToCH" 
        :enableTimePicker="false"
        :clearable="true" 
        :auto-apply="true" 
        :highlight="highlightToday"
      />

    </div>

    <!-- 🧾 Tabelle -->
    <table class="w-full border text-sm text-slate-700 dark:text-slate-200">
      <thead class="bg-slate-100 dark:bg-slate-800">
        <tr>
          <th class="text-left p-2">Gast</th>
          <th class="text-left p-2">Anreise</th>
          <th class="text-left p-2">Abreise</th>
          <th class="text-left p-2">Fahrzeug</th>
          <th class="text-left p-2">Insassen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5" class="p-4 text-center text-slate-500">Lade Buchungen…</td>
        </tr>
        <tr v-else-if="filteredBookings.length === 0">
          <td colspan="5" class="p-4 text-center text-slate-500">Keine Buchungen an diesem Tag</td>
        </tr>
        <tr v-for="booking in filteredBookings" :key="booking.id + booking.spot" class="border-t">
          <td class="p-2">{{ booking.guestName }}</td>
          <td class="p-2">{{ formatDate(booking.checkIn) }}</td>
          <td class="p-2">{{ formatDate(booking.checkOut) }}</td>
          <td class="p-2">{{ booking.carPlate }}</td>
          <td class="p-2">{{ booking.adults + booking.children }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ➕ Button -->
    <div class="mt-6 text-right">
      <button @click="goToBookingForm" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
        + Buchung hinzufügen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useRouter } from 'vue-router';
import { useHostBookings } from '@/composables/Host/useHostBookings';
import { format } from 'date-fns';
import { normalizeDate, formatDateToYMD, formatDateLocalYMD, formatToCH } from '@/composables/utils/dateUtils';

const highlightToday = computed(() => ({
  dates: [new Date()],
}));

const selectToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.value = today;
};


// 📅 Auswahl
const selectedDate = ref<Date>(new Date());

// 📦 Buchungsdaten
const { bookings, loadBookings, loading, error } = useHostBookings();

// 🧭 API-Aufruf bei Start und Datum-Änderung
const fetchData = () => {
  if (!selectedDate.value || !(selectedDate.value instanceof Date)) return;

  console.log('📅 selectedDate (raw):', selectedDate.value);
  const ymd = formatDateLocalYMD(selectedDate.value); // ✅ keine UTC-Verschiebung!
  console.log('📤 sending to API:', ymd);
  loadBookings(ymd, ymd);

};

onMounted(fetchData);
watch(selectedDate, fetchData);

// 🧾 Anzeigeformat
const formatDate = (d: string | Date) =>
  typeof d === 'string'
    ? format(new Date(d), 'dd.MM.yyyy')
    : format(d, 'dd.MM.yyyy');

// 📋 Sichtbare Buchungen
const filteredBookings = computed(() => {
  const day = normalizeDate(selectedDate.value);
  return bookings.value.filter((b) => {
    const checkIn = normalizeDate(new Date(b.checkIn));
    const checkOut = normalizeDate(new Date(b.checkOut));
    return checkIn <= day && checkOut > day;
  });
});

// ➕ Navigation zur Formularseite
const router = useRouter();
const goToBookingForm = () => {
  router.push('/host/buchung-hinzufuegen');
};
</script>
