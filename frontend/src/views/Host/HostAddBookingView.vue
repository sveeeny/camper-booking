<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">
      Manuelle Buchung eintragen
    </h1>

    <!-- 🧭 Formular für Host-Buchung -->
    <GuestView />
  </div>
</template>

<script setup lang="ts">
import GuestView from '@/views/Guest/GuestView.vue';
import { useBookingStore } from '@/store/bookingStore';
import { onMounted } from 'vue';
import { useBookingCleanup } from '@/composables/useBookingCleanup';

const bookingStore = useBookingStore();

useBookingCleanup();

</script>

<style scoped>
/* Optional: zusätzliche Host-spezifische Styles */
</style>
