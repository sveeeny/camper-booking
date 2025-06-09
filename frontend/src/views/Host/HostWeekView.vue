// src/views/HostWeekView.vue
<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Wochenübersicht</h2>

    <div class="flex items-center justify-between mb-4">
      <button @click="prevWeek" class="text-blue-600 hover:underline">← Vorige Woche</button>
      <div class="font-semibold text-slate-700 dark:text-white">
        {{ formatDate(weekStart) }} – {{ formatDate(weekEnd) }}
      </div>
      <button @click="nextWeek" class="text-blue-600 hover:underline">Nächste Woche →</button>
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
  </div>
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

const formatDate = (d: Date) => format(d, 'dd.MM');

const prevWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() - 7);
  weekStart.value = new Date(weekStart.value);
};
const nextWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() + 7);
  weekStart.value = new Date(weekStart.value);
};
</script>
