<!-- src/components/Host/BookingDetailPanel.vue -->
<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black/30 z-40" @click.self="emitClose" />

  <!-- Slide-In Panel -->
  <div
    class="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-white dark:bg-slate-900 shadow-lg z-50 transition-transform duration-300 ease-in-out"
    :class="{ 'translate-x-0': show, 'translate-x-full': !show }"
  >
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
      <h2 class="text-xl font-bold text-slate-800 dark:text-white">Buchungsdetails</h2>
      <button @click="emitClose" class="text-slate-500 hover:text-slate-800 dark:hover:text-white transition">✕</button>
    </div>

    <!-- Inhalt -->
    <div class="p-4 overflow-y-auto max-h-[calc(100vh-64px)]">
      <div v-if="booking" class="space-y-6 text-left text-sm md:text-base">
      <p><strong>ID:</strong> {{ booking.id }}</p>
        <!-- Block 1: Buchungsinfo -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-white dark:bg-slate-800 p-4 rounded shadow border dark:border-slate-700">
            <p><strong>Check-in:</strong> {{ formatDate(booking.checkIn) }} ab 13:00 Uhr</p>
            <p><strong>Check-out:</strong> {{ formatDate(booking.checkOut) }} bis 12:00 Uhr</p>
            <p><strong>Anzahl Fahrzeuge:</strong> {{ booking.cars?.length ?? 0 }}</p>
            <hr class="my-2" />
            <p><strong>Gesamtpreis:</strong> {{ booking.priceTotal }} CHF</p>
          </div>

          <!-- Block 2: Gastinfo -->
          <div class="bg-white dark:bg-slate-800 p-4 rounded shadow border dark:border-slate-700">
            <p><strong>Anrede:</strong> {{ booking.guest?.salutation }}</p>
            <p><strong>Name:</strong> {{ booking.guest?.firstName }} {{ booking.guest?.lastName }}</p>
            <p><strong>Nationalität:</strong> {{ booking.guest?.nationality }}</p>
            <p><strong>E-Mail:</strong> {{ booking.guest?.email }}</p>
            <p><strong>Telefon:</strong> {{ booking.guest?.phoneCountryCode }} {{ booking.guest?.phoneNumber }}</p>
          </div>
        </div>

        <!-- Status & Aktion -->
        <div class="mb-4 px-4">
          <p class="text-sm font-medium">
            Status:
            <span
              :class="[
                'inline-block ml-2 px-2 py-1 rounded text-xs font-semibold',
                booking.status === 'paid' ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-white' :
                booking.status === 'pending' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-white' :
                booking.status === 'cancelled' ? 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-white' :
                'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-white'
              ]"
            >
              {{ booking.status }}
            </span>
          </p>

          <button
            v-if="booking.status !== 'paid'"
            @click="markAsPaid"
            class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            :disabled="updatingStatus"
          >
            {{ updatingStatus ? 'Aktualisiere…' : 'Als bezahlt markieren' }}
          </button>
        </div>

        <!-- Fahrzeugübersicht -->
        <div
          :class="[
            'grid gap-3',
            (booking.cars?.length ?? 0) === 1
              ? 'grid-cols-1'
              : (booking.cars?.length ?? 0) === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3'
          ]"
        >
          <div
            v-for="(car, index) in booking.cars ?? []"
            :key="car.carPlate"
            class="bg-white dark:bg-slate-800 p-4 rounded shadow border dark:border-slate-700"
          >
            <h3 class="font-semibold mb-2">Fahrzeug {{ index + 1 }}</h3>
            <p><strong>KFZ-Nr:</strong> {{ car.carPlate }}</p>
            <p><strong>Erwachsene:</strong> {{ car.adults }}</p>
            <p><strong>Kinder:</strong> {{ car.children }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-slate-500 dark:text-slate-400 mt-10">
        Lade Buchung …
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatToCH } from '@/composables/utils/dateUtils';
import type { HostBookingDetailData } from '@/types';
import { fetchBookingById, markBookingAsPaid } from '@/composables/Host/useHostBookings';

const props = defineProps<{ bookingId: string }>();
const emit = defineEmits(['close']);

const booking = ref<HostBookingDetailData | null>(null);
const updatingStatus = ref(false);
const show = ref(false);

const emitClose = () => {
  show.value = false;
  setTimeout(() => emit('close'), 300); // Animation sauber beenden
};

const markAsPaid = async () => {
  if (!booking.value) return;
  if (!confirm('Diese Buchung wirklich als bezahlt markieren?')) return;

  updatingStatus.value = true;
  try {
    await markBookingAsPaid(booking.value.id);
    booking.value.status = 'paid';
  } catch (err) {
    alert('❌ Status konnte nicht aktualisiert werden.');
    console.error(err);
  } finally {
    updatingStatus.value = false;
  }
};

onMounted(async () => {
  booking.value = await fetchBookingById(props.bookingId);
  show.value = true;
});

const formatDate = (d: string | Date) =>
  typeof d === 'string' ? formatToCH(new Date(d)) : formatToCH(d);
</script>
