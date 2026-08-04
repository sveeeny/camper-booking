// src/views/HostWeekView.vue
<template>
  <section class="mx-auto max-w-6xl space-y-5">
    <div>
      <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Wochenansicht</p>
      <h2 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Belegung</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Freie Plätze und Buchungen für die ausgewählte Woche.
      </p>
    </div>

    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        aria-label="Vorige Woche"
        class="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        @click="prevWeek"
      >
        <span aria-hidden="true">←</span><span class="ml-2 hidden sm:inline">Vorige Woche</span>
      </button>
      <div class="text-center text-sm font-semibold text-slate-700 sm:text-base dark:text-slate-100">
        {{ formatDate(weekStart) }} – {{ formatDate(weekEnd) }}
      </div>
      <button
        type="button"
        aria-label="Nächste Woche"
        class="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        @click="nextWeek"
      >
        <span class="mr-2 hidden sm:inline">Nächste Woche</span><span aria-hidden="true">→</span>
      </button>
    </div>

    <BookingGantt
      :bookings="bookings"
      :start-date="weekStart"
      :max-spots="MAX_SPOTS"
      :load-bookings="reloadBookings"
      @select="showBookingDetail"
    />

    <BookingDetailPanel
      v-if="selectedBookingId"
      :booking-id="selectedBookingId"
      @close="closeDetail"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { formatDateLocalYMD } from '@/composables/utils/dateUtils';
import { useHostBookings } from '@/composables/Host/useHostBookings';
import { format } from 'date-fns';
import BookingDetailPanel from '@/components/Host/BookingDetailPanel.vue';
import BookingGantt from '@/components/Host/BookingGantt.vue';


const selectedBookingId = ref<string | null>(null);
const showBookingDetail = (id: string) => selectedBookingId.value = id;
const closeDetail = () => selectedBookingId.value = null;

const { bookings, loadBookings } = useHostBookings();
const MAX_SPOTS = 5;

const today = new Date();
const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const reloadBookings = () => {
  const from = formatDateLocalYMD(weekStart.value);
  const to = formatDateLocalYMD(weekEnd.value);
  loadBookings(from, to);
};


const weekStart = ref(getMonday(today));
const weekEnd = computed(() => {
  const end = new Date(weekStart.value);
  end.setDate(end.getDate() + 6);
  return end;
});

onMounted(() => {
  const from = formatDateLocalYMD(weekStart.value);
  const to = formatDateLocalYMD(weekEnd.value);
  loadBookings(from, to);
});

watch(weekStart, () => {
  const from = formatDateLocalYMD(weekStart.value);
  const to = formatDateLocalYMD(weekEnd.value);
  loadBookings(from, to);
});

const formatDate = (d: Date) => format(d, 'dd.MM.yyyy');

const prevWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() - 7);
  weekStart.value = new Date(weekStart.value);
};
const nextWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() + 7);
  weekStart.value = new Date(weekStart.value);
};
</script>
