<template>
  <!-- Overlay -->
  <div class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px]" @click.self="emitClose" />

  <!-- Slide-In Panel -->
  <div
    class="fixed right-0 top-0 z-50 h-full w-full border-l border-slate-200 bg-slate-50 shadow-2xl transition-transform duration-300 ease-in-out sm:w-[560px] dark:border-slate-700 dark:bg-slate-950"
    :class="{ 'translate-x-0': show, 'translate-x-full': !show }"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 class="text-xl font-bold text-slate-800 dark:text-white">Buchungsdetails</h2>
      <button
        type="button"
        aria-label="Buchungsdetails schließen"
        class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white"
        @click="emitClose"
      >
        ✕
      </button>
    </div>

    <!-- Inhalt -->
    <div class="max-h-[calc(100vh-64px)] overflow-y-auto p-4 sm:p-5">
      <div v-if="booking" class="space-y-5 text-left text-sm text-slate-800 md:text-base dark:text-slate-100">
        <!-- Metadaten -->
        <div class="break-words rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <p><strong>Erstellt am:</strong> {{ formatTimestamp(booking.createdAt) }}</p>
          <p><strong>Zahlungsstatus aktualisiert:</strong> {{ formatTimestamp(booking.statusUpdatedAt) }}</p>
          <p><strong>Booking-ID:</strong> {{ booking.id }}</p>
          <p><strong>Buchung erstellt von:</strong> {{ booking.source }}</p>
        </div>

        <!-- Bearbeiten-Button -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            @click="toggleEditing"
          >
            {{ isEditing ? 'Speichern' : 'Bearbeiten' }}
          </button>

          <button v-if="canBeDeleted" type="button" @click="deleteBooking" class="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40">
            Buchung löschen
          </button>
        </div>

        <!-- Block 1: Buchungsinfo -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p><strong>Check-in: </strong> {{ formatDate(booking.checkIn) }}</p>
            <p><strong>Check-out: </strong> {{ formatDate(booking.checkOut) }}</p>
            <p><strong>Anzahl Fahrzeuge: </strong> {{ booking.cars?.length ?? 0 }}</p>
            <hr class="my-2" />
            <p><strong>Gesamtpreis: </strong> {{ booking.priceTotal }} CHF</p>
          </div>

          <!-- Block 2: Gastinfo -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p><strong>Anrede: </strong>
              <input v-if="isEditing" v-model="editable.salutation" class="input" />
              <span v-else>{{ booking.guest?.salutation }}</span>
            </p>
            <p><strong>Vorname: </strong>
              <input v-if="isEditing" v-model="editable.firstName" class="input" placeholder="Vorname" />
              <span v-else>{{ booking.guest?.firstName }} </span>
            </p>
            <p><strong>Nachname: </strong>
              <input v-if="isEditing" v-model="editable.lastName" class="input" placeholder="Nachname" />
              <span v-else>{{ booking.guest?.lastName }}</span>
            </p>
            <p><strong>Nationalität: </strong>
              <input v-if="isEditing" v-model="editable.nationality" class="input" />
              <span v-else>{{ booking.guest?.nationality }}</span>
            </p>
            <p><strong>E-Mail: </strong>
              <input v-if="isEditing" v-model="editable.email" class="input" />
              <span v-else>{{ booking.guest?.email }}</span>
            </p>
            <p><strong>Telefon: </strong>
              <input v-if="isEditing" v-model="editable.phoneCountryCode" class="input w-16" />
              <input v-if="isEditing" v-model="editable.phoneNumber" class="input ml-2" />
              <span v-else>{{ booking.guest?.phoneCountryCode }} {{ booking.guest?.phoneNumber }}</span>
            </p>
          </div>
        </div>

        <!-- Status & Aktion -->
        <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900">
          <p class="text-sm font-medium">
            Status:
            <span :class="getStatusBadge(booking.status)">{{ getStatusLabel(booking.status) }}</span>
          </p>

          <button
            v-if="booking.status !== 'paid'"
            @click="markAsPaid"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
            :disabled="updatingStatus"
          >
            {{ updatingStatus ? 'Aktualisiere…' : 'Als bezahlt markieren' }}
          </button>
        </div>

        <!-- Fahrzeuge -->
        <div class="grid gap-3" :class="gridClass">
          <div v-for="(car, index) in booking.cars ?? []" :key="car.carPlate" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 class="font-semibold mb-2">Fahrzeug {{ index + 1 }}</h3>
            <p><strong>KFZ-Nr: </strong> {{ car.carPlate }}</p>
            <p><strong>Erwachsene: </strong> {{ car.adults }}</p>
            <p><strong>Kinder: </strong> {{ car.children }}</p>
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

const toggleEditing = async () => {
  if (!isEditing.value) {
    isEditing.value = true;
    return;
  }

  if (await saveChanges()) {
    isEditing.value = false;
  }
};

const saveChanges = async (): Promise<boolean> => {
  if (!booking.value) return false;
  try {
    await updateBooking(booking.value.id, editable);
    if (booking.value.guest) {
      Object.assign(booking.value.guest, editable);
    }
    emitter.emit('booking-updated');
    return true;
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    alert('Die Änderungen konnten nicht gespeichert werden.');
    return false;
  }
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
  if (isEditing.value) void saveChanges();
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

const getStatusLabel = (status: string) => {
  if (status === 'paid') return 'Bezahlt';
  if (status === 'pending') return 'Ausstehend';
  if (status === 'cash') return 'Barzahlung';
  if (status === 'cancelled') return 'Storniert';
  return status;
};

const gridClass = computed(() => {
  const n = booking.value?.cars?.length ?? 0;
  return n === 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';
});
</script>

<style scoped>
.input {
  @apply mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white;
}
</style>
