<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div v-if="loading" class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
      Buchungen werden geladen …
    </div>

    <div v-else-if="bookings.length === 0" class="p-8 text-center">
      <p class="font-medium text-slate-700 dark:text-slate-200">Keine Buchungen an diesem Tag</p>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Wähle ein anderes Datum oder füge eine Buchung hinzu.
      </p>
    </div>

    <template v-else>
      <div class="divide-y divide-slate-200 md:hidden dark:divide-slate-700">
        <button
          v-for="booking in bookings"
          :key="`${booking.id}-${booking.spot}`"
          type="button"
          class="block w-full p-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-slate-800"
          @click="$emit('select', booking.id)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-semibold text-slate-900 dark:text-white">
                {{ booking.guestName }}
              </p>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ booking.carPlate }} · {{ booking.adults + booking.children }} Personen
              </p>
            </div>
            <span :class="statusClass(booking.status)">
              {{ statusLabel(booking.status) }}
            </span>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt class="text-slate-500 dark:text-slate-400">Anreise</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-100">
                {{ formatToCH(new Date(booking.checkIn)) }}
              </dd>
            </div>
            <div>
              <dt class="text-slate-500 dark:text-slate-400">Abreise</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-100">
                {{ formatToCH(new Date(booking.checkOut)) }}
              </dd>
            </div>
            <div class="col-span-2">
              <dt class="text-slate-500 dark:text-slate-400">Gebucht durch</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-100">
                {{ sourceLabel(booking.source) }}
              </dd>
            </div>
          </dl>
        </button>
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="min-w-[850px] w-full text-sm text-slate-700 dark:text-slate-200">
          <thead class="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th class="p-3 text-left">Gast</th>
              <th class="p-3 text-left">Anreise</th>
              <th class="p-3 text-left">Abreise</th>
              <th class="p-3 text-left">Fahrzeug</th>
              <th class="p-3 text-left">Insassen</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Gebucht durch</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="booking in bookings"
              :key="`${booking.id}-${booking.spot}`"
              role="button"
              tabindex="0"
              class="cursor-pointer transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-slate-800"
              @click="$emit('select', booking.id)"
              @keydown.enter="$emit('select', booking.id)"
              @keydown.space.prevent="$emit('select', booking.id)"
            >
              <td class="p-3 font-medium text-slate-900 dark:text-white">{{ booking.guestName }}</td>
              <td class="p-3">{{ formatToCH(new Date(booking.checkIn)) }}</td>
              <td class="p-3">{{ formatToCH(new Date(booking.checkOut)) }}</td>
              <td class="p-3">{{ booking.carPlate }}</td>
              <td class="p-3">{{ booking.adults + booking.children }}</td>
              <td class="p-3">
                <span :class="statusClass(booking.status)">{{ statusLabel(booking.status) }}</span>
              </td>
              <td class="p-3">{{ sourceLabel(booking.source) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatToCH } from '@/composables/utils/dateUtils';
import type { HostBookingSummary } from '@/types';

defineProps<{
  bookings: HostBookingSummary[];
  loading: boolean;
}>();

defineEmits<{
  (event: 'select', id: string): void;
}>();

const statusLabel = (status: string) => {
  if (status === 'paid') return 'Bezahlt';
  if (status === 'pending') return 'Ausstehend';
  if (status === 'cash') return 'Barzahlung';
  if (status === 'cancelled') return 'Storniert';
  return status;
};

const statusClass = (status: string) => {
  const base = 'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold';
  if (status === 'paid') return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200`;
  if (status === 'pending') return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200`;
  if (status === 'cancelled') return `${base} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200`;
  return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200`;
};

const sourceLabel = (source: string) => {
  if (source === 'host') return 'Host';
  if (source === 'admin') return 'Administrator';
  if (source === 'guest') return 'Gast';
  return source;
};
</script>
