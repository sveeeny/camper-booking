<template>
  <div class="max-w-2xl mx-auto text-center py-12 px-4">
    <h1 class="text-3xl font-bold text-green-600 mb-4">🎉 Vielen Dank für deine Buchung!</h1>
    <p class="text-lg text-gray-700 dark:text-slate-300 mb-6">
      Deine Zahlung war erfolgreich. Wir haben deine Buchung erhalten und senden dir in Kürze eine Bestätigung per
      E-Mail.
    </p>

    <div class="space-y-4 text-sm text-gray-600 dark:text-slate-400">
      <p><strong>Buchungsnummer:</strong> {{ bookingId || '–' }}</p>

      <div class="flex justify-center gap-4 flex-wrap mt-4">
        <!-- PDF-Download vorbereiten (noch deaktiviert) -->
        <!--
        <a
          v-if="bookingId"
          :href="`/api/bookings/${bookingId}/confirmation.pdf`"
          target="_blank"
          class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white px-4 py-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
        >
          📄 Buchungsbestätigung (PDF)
        </a>
        -->

        <!-- Link zur Hauptseite -->
        <a href="https://byherger.ch" target="_blank"
          class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white px-4 py-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600">
          🌐 Zur Hauptseite (byherger.ch)
        </a>
      </div>
    </div>

    <router-link :to="redirectPath"
      class="mt-8 inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
      {{ isHostOrAdmin ? 'Zurück zum Dashboard' : 'Zurück zur Startseite' }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { useBookingCleanup } from '@/composables/useBookingCleanup';

const route = useRoute();
const userStore = useUserStore();

const isHostOrAdmin = computed(() => userStore.role === 'host' || userStore.role === 'admin');
const redirectPath = computed(() => (isHostOrAdmin.value ? '/host' : '/'));

const bookingId = ref<string | null>(null);
const { clearOnlyLocal } = useBookingCleanup();
onMounted(async () => {
  const id = route.query.bookingId as string;
  if (id) {
    bookingId.value = id;
    try {
      await axios.patch(`/bookings/${id}/status`, { status: 'paid' });
      console.log('✅ Buchungsstatus auf "paid" gesetzt');
    } catch (err) {
      console.error('❌ Fehler beim Setzen von Status "paid":', err);
    }
  }
  clearOnlyLocal();
});
</script>
