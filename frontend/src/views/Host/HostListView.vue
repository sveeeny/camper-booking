<!-- src/views/Host/HostListView.vue -->
<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Buchungen</h2>

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

    <!-- Neue Komponente -->
    <BookingTable
      :bookings="filteredBookings"
      :loading="loading"
      @select="showBookingDetail"
    />

    <div class="mt-6 text-right">
      <button @click="goToBookingForm" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
        + Buchung hinzufügen
      </button>
    </div>
  </div>

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
