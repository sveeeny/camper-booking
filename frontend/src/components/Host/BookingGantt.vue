<!-- src/components/Host/BookingGantt.vue -->
<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <p class="border-b border-slate-200 px-4 py-2 text-xs text-slate-500 md:hidden dark:border-slate-700 dark:text-slate-400">
      Für die ganze Woche seitlich wischen.
    </p>
    <div class="overflow-x-auto overscroll-x-contain">
      <div
        class="grid min-w-[640px] md:min-w-[720px]"
        :style="`grid-template-columns: repeat(${daysOfWeek.length}, minmax(88px, 1fr));`"
      >
          <!-- Kopfzeile -->
          <div v-for="(day, i) in daysOfWeek" :key="i"
            class="flex h-16 items-center justify-center border-b border-r border-slate-200 bg-slate-100 p-2 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {{ formatDay(day) }}
          </div>

          <!-- Freie Plätze -->
          <div v-for="(free, i) in freeSpotsPerDay" :key="'free-' + i"
            class="flex h-12 items-center justify-center border-b border-r border-white/50 p-2 text-center font-semibold dark:border-slate-800"
            :class="getSpotColor(free)">
            {{ free }}
          </div>

          <!-- Buchungen -->
          <template v-for="(row, rowIndex) in layoutRows" :key="rowIndex">
            <div v-for="i in daysOfWeek.length" :key="'cell-' + rowIndex + '-' + i" class="relative h-16 border-b border-r border-slate-100 dark:border-slate-800" />

            <template v-for="booking in row" :key="booking.id">
              <button
                type="button"
                class="relative z-[1] m-1 flex cursor-pointer flex-col justify-center overflow-hidden whitespace-nowrap rounded-lg border px-2 py-1 text-left text-sm leading-tight text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="getBookingClass(booking)" :style="{
                  gridColumn: booking.offset + 1 + ' / span ' + booking.length,
                  gridRow: rowIndex + 3
                }" @click="$emit('select', booking.id)">
                <span class="font-bold">{{ booking.carPlate }}</span>
                <span class="text-xs">{{ booking.guestName }}</span>
              </button>
            </template>
          </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HostBookingSummary } from '@/types';
import { formatDateLocalYMD, normalizeDate } from '@/composables/utils/dateUtils';
import emitter from '@/composables/utils/eventBus';
import { onMounted, onUnmounted } from 'vue';


onMounted(() => {
  emitter.on('booking-updated', props.loadBookings);
});

onUnmounted(() => {
  emitter.off('booking-updated', props.loadBookings);
});





const props = defineProps<{
  bookings: HostBookingSummary[];
  startDate: Date;
  maxSpots: number;
  loadBookings: () => void;
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

      // ⛔ Ungültige oder leere Buchung
      if (!b.checkOut || checkOut <= checkIn) return null;

      // ✅ Letzte sichtbare Nacht (checkOut - 1 Tag)
      const lastNight = new Date(+checkOut - 86400000);

      // ⛔ Buchung komplett außerhalb der Woche
      if (lastNight < weekStart || checkIn >= weekEnd) return null;

      // ✅ Sichtbarer Zeitraum innerhalb dieser Woche
      const visibleStart = checkIn < weekStart ? weekStart : checkIn;
      const visibleEndExclusive = new Date(Math.min(+lastNight + 86400000, +weekEnd));


      const offset = Math.floor((+visibleStart - +weekStart) / 86400000);
      const length = Math.floor((+visibleEndExclusive - +visibleStart) / 86400000);


      if (length <= 0) return null;

      return { ...b, offset, length };
    })
    .filter((b): b is PositionedBooking => b !== null);

  // Buchungen in Gantt-Zeilen aufteilen
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
  if (booking.status === 'paid') return 'border-blue-700 bg-blue-600';
  if (booking.status === 'cash') return 'border-emerald-700 bg-emerald-600';
  if (booking.status === 'pending') return 'border-amber-700 bg-amber-600';
  if (booking.status === 'cancelled') return 'border-red-700 bg-red-600';
  return 'border-slate-600 bg-slate-500';
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
