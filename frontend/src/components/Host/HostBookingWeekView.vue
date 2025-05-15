<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { formatDateToYMD } from '@/composables/utils/dateUtils';
import { useHostBookings } from '@/composables/Host/useHostBookings';
import type { HostBooking } from '@/composables/Host/useHostBookings';
import { useRouter } from 'vue-router';
import HostBookingDetail from '@/components/Host/HostBookingDetail.vue'; // ⬅️ Import

const selectedBookingId = ref<string | null>(null);

const showBookingDetail = (id: string) => {
  selectedBookingId.value = id;
};

const closeDetail = () => {
  selectedBookingId.value = null;
};


const { bookings, loadBookings } = useHostBookings();
const MAX_SPOTS = 5;

// const router = useRouter();

// const goToDetail = (id: string) => {
//   router.push(`/host/buchung/${id}`);
// };

// 📅 Wochenlogik
const today = new Date();
const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};
const weekStart = ref(getMonday(today));
const weekEnd = computed(() => {
  const end = new Date(weekStart.value);
  end.setDate(end.getDate() + 6);
  return end;
});
const daysOfWeek = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    return d;
  })
);

// 🔁 Buchungsdaten laden
const loadData = () => {
  const from = formatDateToYMD(weekStart.value);
  const to = formatDateToYMD(weekEnd.value);
  loadBookings(from, to);
};
onMounted(loadData);
watch(weekStart, loadData);

// ✅ Freie Plätze je Tag (um 1 Tag korrigiert!)
const freeSpotsPerDay = computed(() =>
  daysOfWeek.value.map((day) => {
    const corrected = new Date(day);
    corrected.setDate(corrected.getDate() + 1); // ⬅️ Korrektur um 1 Tag
    const ymd = formatDateToYMD(corrected);
    const occupied = bookings.value.filter(
      (b) => ymd >= b.checkIn && ymd < b.checkOut
    ).length;
    return Math.max(0, MAX_SPOTS - occupied);
  })
);

// 🎨 Farben
const getSpotColor = (free: number): string => {
  if (free === 0) return 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-white';
  if (free === 1) return 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-white';
  if (free === 2) return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-white';
  if (free === 3) return 'bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-white';
  if (free === 4) return 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-white';
  return 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-white';
};

const getBookingClass = (booking: HostBooking) => {
  // 🔴 Unbezahlte Buchungen immer rot
  if (booking.status !== 'paid') {
    return 'bg-red-300 text-red-900 dark:bg-red-600 dark:text-white';
  }

  // 🎨 Farbrotation für bezahlte Buchungen
  const classes = [
    'bg-blue-200 text-blue-900 dark:bg-blue-600 dark:text-white',
    'bg-green-200 text-green-900 dark:bg-green-600 dark:text-white',
    'bg-yellow-200 text-yellow-900 dark:bg-yellow-600 dark:text-white',
    'bg-pink-200 text-pink-900 dark:bg-pink-600 dark:text-white',
    'bg-purple-200 text-purple-900 dark:bg-purple-600 dark:text-white',
  ];

  // Hash aus UUID berechnen
  const hash = Array.from(booking.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return classes[hash % classes.length];
};


// 📊 Gantt-Zeilenberechnung
type PositionedBooking = HostBooking & { offset: number; length: number };

const layoutRows = computed<PositionedBooking[][]>(() => {
  const positioned: PositionedBooking[] = bookings.value.map((b) => {
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    const offset = Math.max(
      0,
      Math.floor((+checkIn - +weekStart.value) / (1000 * 60 * 60 * 24))
    );
    const length = Math.floor((+checkOut - +checkIn) / (1000 * 60 * 60 * 24));
    return { ...b, offset, length };
  });

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
    if (!placed) {
      rows.push([booking]);
    }
  }

  return rows;
});

// 📆 Navigation
const formatDay = (date: Date) =>
  date.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' });

const formatDate = (date: Date) =>
  date.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });

const prevWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() - 7);
  weekStart.value = new Date(weekStart.value);
};
const nextWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() + 7);
  weekStart.value = new Date(weekStart.value);
};
</script>



<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Wochenübersicht</h2>

    <!-- 🔁 Navigation -->
    <div class="flex items-center justify-between mb-4">
      <button @click="prevWeek" class="text-blue-600 hover:underline">← Vorige Woche</button>
      <div class="font-semibold text-slate-700 dark:text-white">
        {{ formatDate(weekStart) }} – {{ formatDate(weekEnd) }}
      </div>
      <button @click="nextWeek" class="text-blue-600 hover:underline">Nächste Woche →</button>
    </div>

    <!-- 📅 Gantt-Grid -->
    <div class="grid" :style="`grid-template-columns: 120px repeat(${daysOfWeek.length}, 1fr);`">
      <!-- 🧠 Kopfzeile -->
      <div class="p-2 font-medium border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">Plätze
        frei</div>
      <div v-for="(day, i) in daysOfWeek" :key="'head-' + i"
        class="p-2 border border-slate-200 dark:border-slate-600 text-sm bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-white">
        {{ formatDay(day) }}
      </div>

      <!-- 🧮 Zeile mit freien Plätzen -->
      <div class="p-2 font-medium border-l border-b border-slate-200 dark:border-slate-600 min-h-12 flex items-center">
        Frei
      </div>
      <div v-for="(free, i) in freeSpotsPerDay" :key="'free-' + i"
        class="p-2 text-center font-semibold border-b border-r border-slate-200 dark:border-slate-600 min-h-12 flex items-center justify-center"
        :class="getSpotColor(free)">
        {{ free }}
      </div>

      <!-- 📦 Buchungen ab Zeile 3 – ohne sichtbare Grid-Borders -->
      <template v-for="(row, rowIndex) in layoutRows" :key="'row-' + rowIndex">
        <!-- Linke Spalte -->
        <div></div>

        <!-- Zellen -->
        <div v-for="i in daysOfWeek.length" :key="'cell-' + rowIndex + '-' + i" class="relative min-h-12"></div>

        <!-- 📌 Buchungen im Grid platzieren -->
        <template v-for="booking in row" :key="booking.carPlate + booking.checkIn">
          <div
            class="cursor-pointer text-sm text-black dark:text-white px-2 py-[6px] m-[2px] overflow-hidden whitespace-nowrap flex flex-col justify-center leading-tight h-half rounded-xl"
            :class="getBookingClass(booking)" :style="{
              gridColumn: booking.offset + 2 + ' / span ' + booking.length,
              gridRow: rowIndex + 3,
            }" @click="showBookingDetail(booking.id)">
            <span class="font-bold">{{ booking.carPlate }}</span>
            <span class="text-xs">{{ booking.guestName }}</span>
          </div>
          

        </template>
      </template>
    </div>
  </div>
  <HostBookingDetail v-if="selectedBookingId" :booking-id="selectedBookingId" @close="closeDetail" />
</template>
