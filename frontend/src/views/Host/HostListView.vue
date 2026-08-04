<!-- src/views/Host/HostListView.vue -->
<template>
  <section class="mx-auto max-w-5xl space-y-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Tagesansicht</p>
        <h2 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Buchungen</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Alle anwesenden Gäste und Fahrzeuge für das gewählte Datum.
        </p>
      </div>

      <button
        type="button"
        class="w-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        @click="selectToday"
      >
        Heute
      </button>
    </div>

    <div class="max-w-sm rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        Datum auswählen
      </label>
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

    <!-- Neue Komponente -->
    <BookingTable
      :bookings="filteredBookings"
      :loading="loading"
      @select="showBookingDetail"
    />

    <div class="text-right">
      <button
        type="button"
        class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-auto"
        @click="goToBookingForm"
      >
        + Buchung hinzufügen
      </button>
    </div>
  </section>

  <HostBookingDetail
    v-if="selectedBookingId"
    :booking-id="selectedBookingId"
    @close="closeDetail"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import { useHostBookings } from '@/composables/Host/useHostBookings';
import { normalizeDate, formatDateLocalYMD, formatToCH } from '@/composables/utils/dateUtils';

import BookingTable from '@/components/Host/BookingTable.vue';
import HostBookingDetail from '@/components/Host/BookingDetailPanel.vue';
import type { HostBookingSummary } from '@/types';

const router = useRouter();
const selectedDate = ref<Date>(new Date());
const selectedBookingId = ref<string | null>(null);

const { bookings, loadBookings, loading } = useHostBookings();

const highlightToday = computed(() => ({ dates: [new Date()] }));

const selectToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.value = today;
};

const fetchData = () => {
  if (!selectedDate.value) return;
  const ymd = formatDateLocalYMD(selectedDate.value);
  loadBookings(ymd, ymd);
};
onMounted(fetchData);
watch(selectedDate, fetchData);

const filteredBookings = computed<HostBookingSummary[]>(() => {
  const day = normalizeDate(selectedDate.value);
  return bookings.value.filter((b) => {
    const checkIn = normalizeDate(new Date(b.checkIn));
    const checkOut = normalizeDate(new Date(b.checkOut));
    return checkIn <= day && checkOut > day;
  });
});

const showBookingDetail = (id: string) => {
  selectedBookingId.value = id;
};
const closeDetail = () => {
  selectedBookingId.value = null;
};
const goToBookingForm = () => {
  router.push('/host/buchung-hinzufuegen');
};
</script>
