<!-- src/components/Host/BookingGantt.vue -->
<template>
  <div class="grid" :style="`grid-template-columns: 120px repeat(${daysOfWeek.length}, 1fr);`">
    <!-- Kopfzeile -->
    <div class="p-2 font-medium border bg-slate-100 dark:bg-slate-800">Plätze frei</div>
    <div v-for="(day, i) in daysOfWeek" :key="i"
      class="p-2 border text-sm font-medium text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800">
      {{ formatDay(day) }}
    </div>

    <!-- Freie Plätze -->
    <div class="p-2 font-medium border-l border-b min-h-12 flex items-center">Frei</div>
    <div v-for="(free, i) in freeSpotsPerDay" :key="'free-' + i"
      class="p-2 text-center font-semibold border-b border-r min-h-12 flex items-center justify-center"
      :class="getSpotColor(free)">
      {{ free }}
    </div>

    <!-- Buchungen -->
    <template v-for="(row, rowIndex) in layoutRows" :key="rowIndex">
      <div></div>
      <div v-for="i in daysOfWeek.length" :key="'cell-' + rowIndex + '-' + i" class="relative min-h-12" />

      <template v-for="booking in row" :key="booking.id">
        <div
          class="cursor-pointer text-sm px-2 py-1 m-[2px] overflow-hidden whitespace-nowrap flex flex-col justify-center leading-tight h-half rounded-xl text-white"
          :class="getBookingClass(booking)" :style="{
            gridColumn: booking.offset + 2 + ' / span ' + booking.length,
            gridRow: rowIndex + 3
          }" @click="$emit('select', booking.id)">
          <span class="font-bold">{{ booking.carPlate }}</span>
          <span class="text-xs">{{ booking.guestName }}</span>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HostBookingSummary } from '@/types';
import { formatDateLocalYMD, formatDateToYMD, normalizeDate } from '@/composables/utils/dateUtils';

const props = defineProps<{
  bookings: HostBookingSummary[];
  startDate: Date;
  maxSpots: number;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

const daysOfWeek = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(props.startDate);
    d.setDate(d.getDate() + i);
    return d;
  })
);

const freeSpotsPerDay = computed(() =>
  daysOfWeek.value.map((day) => {
    const ymd = formatDateLocalYMD(day); // ← ohne +1!
    const occupied = props.bookings.filter(
      (b) => ymd >= b.checkIn && ymd < b.checkOut
    ).length;
    return Math.max(0, props.maxSpots - occupied);
  })
);


type PositionedBooking = HostBookingSummary & { offset: number; length: number };

const layoutRows = computed<PositionedBooking[][]>(() => {
  const weekStart = normalizeDate(new Date(props.startDate));
  const weekEnd = new Date(+weekStart + 7 * 86400000); // exklusiv

  const positioned: PositionedBooking[] = props.bookings
    .map((b) => {
      const checkIn = normalizeDate(new Date(b.checkIn));
      const checkOut = normalizeDate(new Date(b.checkOut));

      if (!b.checkOut || checkOut <= checkIn) return null;

      // letzte Nacht
      const lastNight = new Date(+checkOut - 86400000);

      // keine sichtbare Nacht innerhalb dieser Woche
      if (lastNight < weekStart || checkIn >= weekEnd) return null;

      const visibleStart = checkIn < weekStart ? weekStart : checkIn;

      // exklusives Ende: entweder Nacht + 1 oder Wochenende, je nachdem was früher kommt
      const visibleEndExclusive = new Date(Math.min(+lastNight + 86400000, +weekEnd));

      const offset = Math.floor((+visibleStart - +weekStart) / 86400000);
      const length = Math.floor((+visibleEndExclusive - +visibleStart) / 86400000);

      if (length <= 0) return null;

      return { ...b, offset, length };
    })
    .filter((b): b is PositionedBooking => b !== null);

  // Buchungen auf Zeilen verteilen
  const rows: PositionedBooking[][] = [];
  for (const booking of positioned) {
    let placed = false;
    for (const row of rows) {
      const overlaps = row.some(
        (b) =>
          booking.offset < b.offset + b.length &&
          booking.offset + booking.length > b.offset
      );
      if (!overlaps) {
        row.push(booking);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([booking]);
  }

  return rows;
});


const getBookingClass = (booking: HostBookingSummary) => {
  if (booking.status !== 'paid') {
    return 'bg-red-600';
  }

  const colors = [
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-pink-600',
    'bg-purple-600',
  ];
  const hash = Array.from(booking.id).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getSpotColor = (free: number): string => {
  if (free === 0) return 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-white';
  if (free === 1) return 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-white';
  if (free === 2) return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-white';
  if (free === 3) return 'bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-white';
  if (free === 4) return 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-white';
  return 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-white';
};

const formatDay = (date: Date) =>
  date.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' });
</script>
