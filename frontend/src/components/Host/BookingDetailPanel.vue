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
        <!-- Metadaten -->
        <div class="text-xs text-slate-500 dark:text-slate-400">
          <p><strong>Erstellt am:</strong> {{ formatTimestamp(booking.createdAt) }}</p>
          <p><strong>Status aktualisiert:</strong> {{ formatTimestamp(booking.statusUpdatedAt) }}</p>
          <p><strong>Booking-ID:</strong> {{ booking.id }}</p>
          <p v-if="booking.source === 'host'" class="mt-1 inline-block bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">Manuelle Buchung</p>
        </div>

        <!-- Bearbeiten-Button -->
        <div class="flex items-center gap-3">
          <button @click="toggleEditing" class="text-blue-600 hover:underline">
            {{ isEditing ? 'Bearbeiten beenden' : 'Bearbeiten aktivieren' }}
          </button>

          <button v-if="canBeDeleted" @click="deleteBooking" class="text-red-600 hover:underline ml-auto">
            Buchung löschen
          </button>
        </div>

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
            <p><strong>Anrede:</strong>
              <input v-if="isEditing" v-model="editable.salutation" class="input" />
              <span v-else>{{ booking.guest?.salutation }}</span>
            </p>
            <p><strong>Name:</strong>
              <input v-if="isEditing" v-model="editable.firstName" class="input" placeholder="Vorname" />
              <span v-else>{{ booking.guest?.firstName }}</span>
              <input v-if="isEditing" v-model="editable.lastName" class="input ml-2" placeholder="Nachname" />
              <span v-else>{{ booking.guest?.lastName }}</span>
            </p>
            <p><strong>Nationalität:</strong>
              <input v-if="isEditing" v-model="editable.nationality" class="input" />
              <span v-else>{{ booking.guest?.nationality }}</span>
            </p>
            <p><strong>E-Mail:</strong>
              <input v-if="isEditing" v-model="editable.email" class="input" />
              <span v-else>{{ booking.guest?.email }}</span>
            </p>
            <p><strong>Telefon:</strong>
              <input v-if="isEditing" v-model="editable.phoneCountryCode" class="input w-16" />
              <input v-if="isEditing" v-model="editable.phoneNumber" class="input ml-2" />
              <span v-else>{{ booking.guest?.phoneCountryCode }} {{ booking.guest?.phoneNumber }}</span>
            </p>
          </div>
        </div>

        <!-- Status & Aktion -->
        <div class="mb-4 px-4">
          <p class="text-sm font-medium">
            Status:
            <span :class="getStatusBadge(booking.status)">{{ booking.status }}</span>
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

        <!-- Fahrzeuge -->
        <div class="grid gap-3" :class="gridClass">
          <div v-for="(car, index) in booking.cars ?? []" :key="car.carPlate" class="bg-white dark:bg-slate-800 p-4 rounded shadow border dark:border-slate-700">
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
import { ref, computed, reactive, onMounted, watch, onBeforeUnmount } from 'vue';
import { formatToCH, formatTimestamp } from '@/composables/utils/dateUtils';
import type { HostBookingDetailData } from '@/types';
import { fetchBookingById, markBookingAsPaid, updateBooking, deleteBookingById } from '@/composables/Host/useHostBookings';
import emitter from '@/composables/utils/eventBus';


const props = defineProps<{ bookingId: string }>();
const emit = defineEmits(['close']);

const booking = ref<HostBookingDetailData | null>(null);
const show = ref(false);
const updatingStatus = ref(false);
const isEditing = ref(false);
const editable = reactive<any>({});

const emitClose = () => {
  show.value = false;
  setTimeout(() => emit('close'), 300);
};

const toggleEditing = () => {
  isEditing.value = !isEditing.value;
  if (!isEditing.value) saveChanges();
};

const saveChanges = async () => {
  if (!booking.value || !isEditing.value) return;
  try {
    await updateBooking(booking.value.id, editable);
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
  }
  emitter.emit('booking-updated');
};

const deleteBooking = async () => {
  if (!booking.value) return;
  const confirmed = confirm('Diese Buchung wirklich löschen?');
  if (!confirmed) return;
  await deleteBookingById(booking.value.id);
  emitter.emit('booking-updated');
  emitClose();
};

const markAsPaid = async () => {
  if (!booking.value) return;
  updatingStatus.value = true;
  try {
    await markBookingAsPaid(booking.value.id);
    booking.value.status = 'paid';
  } catch (err) {
    alert('❌ Status konnte nicht aktualisiert werden.');
  } finally {
    updatingStatus.value = false;
  }
  emitter.emit('booking-updated');
};

onMounted(async () => {
  booking.value = await fetchBookingById(props.bookingId);
  if (booking.value) {
    Object.assign(editable, booking.value.guest);
  }
  show.value = true;
});

onBeforeUnmount(() => {
  if (isEditing.value) saveChanges();
});

const canBeDeleted = computed(() => {
  if (!booking.value || booking.value.status === 'paid') return false;
  const created = new Date(booking.value.createdAt);
  return Date.now() - created.getTime() > 10 * 60 * 1000;
});

const formatDate = (d: string | Date) =>
  typeof d === 'string' ? formatToCH(new Date(d)) : formatToCH(d);

const getStatusBadge = (status: string) => {
  const base = 'inline-block ml-2 px-2 py-1 rounded text-xs font-semibold';
  return [
    base,
    status === 'paid'
      ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-white'
      : status === 'pending'
      ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-white'
      : status === 'cancelled'
      ? 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-white'
      : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-white',
  ];
};

const gridClass = computed(() => {
  const n = booking.value?.cars?.length ?? 0;
  return n === 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';
});
</script>

<style scoped>
.input {
  @apply w-full mt-1 p-1 border rounded dark:bg-slate-700 dark:text-white;
}
</style>
