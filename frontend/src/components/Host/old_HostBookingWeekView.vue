<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { formatDateToYMD, normalizeDate } from '@/composables/utils/dateUtils';
import { useHostBookings } from '@/composables/Host/useHostBookings';
import type { HostBooking } from '@/composables/Host/useHostBookings';



// 📦 Buchungsdaten laden
const { bookings, loadBookings } = useHostBookings();

// 🔢 Konstante Anzahl verfügbarer Plätze
const MAX_SPOTS = 5;

// 📅 Start der Woche bestimmen
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

const daysOfWeek = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    return d;
  });
});

const loadData = () => {
  const from = formatDateToYMD(weekStart.value);
  const to = formatDateToYMD(weekEnd.value);
  loadBookings(from, to);
};

onMounted(loadData);
watch(weekStart, loadData);


type BookingGroup = {
  bookingId: number;
  cars: HostBooking[];
};

const groupedBookings = computed<BookingGroup[]>(() => {
  const map = new Map<number, HostBooking[]>();

  bookings.value.forEach((b) => {
    if (!map.has(b.id)) map.set(b.id, []);
    map.get(b.id)!.push(b);
  });

  return Array.from(map.entries()).map(([bookingId, cars]) => ({
    bookingId,
    cars,
  }));
});

// 🎨 Farbklassen nach bookingId
const getBookingClass = (bookingId: number) => {
  const classes = [
    'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white',
    'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white',
    'bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-white',
    'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white',
  ];
  return classes[bookingId % classes.length];
};

// 🗓️ Prüfen ob ein Auto an einem Tag belegt
const isCarPresentOnDay = (car: HostBooking, day: Date): boolean => {
  const current = normalizeDate(day).getTime();
  const checkIn = normalizeDate(new Date(car.checkIn)).getTime();
  const checkOut = normalizeDate(new Date(car.checkOut)).getTime();
  return current >= checkIn && current < checkOut;
};



// 📅 Datum formatieren
const formatDate = (date: Date) =>
  date.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });

const formatDay = (date: Date) =>
  date.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' });

// ➕ Vor-/Zurück-Navigation
const prevWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() - 7);
  weekStart.value = new Date(weekStart.value);
};
const nextWeek = () => {
  weekStart.value.setDate(weekStart.value.getDate() + 7);
  weekStart.value = new Date(weekStart.value);
};

// 🔢 Freie Plätze je Tag berechnen
const freeSpotsPerDay = computed(() => {
  return daysOfWeek.value.map((day) => {
    const ymd = formatDateToYMD(day);
    const spotsTaken = bookings.value.filter(
      (b) => ymd >= b.checkIn && ymd < b.checkOut
    ).length;
    return Math.max(0, MAX_SPOTS - spotsTaken);
  });
});

// 🎨 Farbverlauf für freie Plätze
const getSpotColor = (free: number): string => {
  if (free === 0) return 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-white';
  if (free === 1) return 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-white';
  if (free === 2) return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-white';
  if (free === 3) return 'bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-white';
  if (free === 4) return 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-white';
  return 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-white';
};
</script>



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

    <div class="overflow-x-auto">
      <table class="min-w-full border text-sm text-slate-800 dark:text-slate-200">
        <thead class="bg-slate-100 dark:bg-slate-800">
          <tr>
            <th class="p-2 text-left w-28">Plätze frei</th>
            <th v-for="(day, i) in daysOfWeek" :key="'day-' + i" class="p-2 text-left whitespace-nowrap">
              {{ formatDay(day) }}
            </th>
          </tr>
          <!-- 🟩 Zeile mit freien Plätzen -->
          <tr>
            <td class="p-2 font-medium">Frei</td>
            <td v-for="(free, i) in freeSpotsPerDay" :key="'free-' + i" class="p-2 text-center font-semibold"
              :class="getSpotColor(free)">
              {{ free }}
            </td>
          </tr>
        </thead>

        <tbody>
          <tr v-for="group in groupedBookings" :key="'booking-' + group.bookingId" class="border-t">
            <td class="p-2 font-medium">#{{ group.bookingId }}</td>
            <td v-for="(day, i) in daysOfWeek" :key="'cell-' + group.bookingId + '-' + i"
              class="p-2 whitespace-nowrap bg-white dark:bg-slate-900 border-l">
              <div v-for="car in group.cars.filter(c => isCarPresentOnDay(c, day))" :key="car.carPlate"
                class="flex flex-col leading-snug text-sm rounded px-2 py-1" :class="getBookingClass(group.bookingId)">
                <span class="font-semibold">{{ car.carPlate }}</span>
                <span>{{ car.guestName }}</span>
              </div>

            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
