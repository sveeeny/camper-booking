<template>
  <div class="max-w-2xl mx-auto text-center py-12 px-4">
    <h1 class="text-3xl font-bold text-green-600 mb-4">🎉 Vielen Dank für deine Buchung!</h1>
    <p class="text-lg text-gray-700 mb-6">
      Deine Zahlung war erfolgreich. Wir haben deine Buchung erhalten und werden dir in Kürze eine Bestätigung per
      E-Mail senden.
    </p>

    <router-link
      :to="redirectPath"
      class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
    >
      {{ isHostOrAdmin ? 'Zurück zum Dashboard' : 'Zurück zur Startseite' }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import axios from 'axios';
import router from '@/router';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/userStore';

const route = useRoute();
const userStore = useUserStore();

const isHostOrAdmin = computed(() => userStore.role === 'host' || userStore.role === 'admin');
const redirectPath = computed(() => (isHostOrAdmin.value ? '/host' : '/'));

onMounted(async () => {
  const bookingId = route.query.bookingId;
  if (bookingId) {
    try {
      await axios.patch(`/bookings/${bookingId}/status`, {
        status: 'paid',
      });
      console.log('✅ Buchungsstatus auf "paid" gesetzt');
    } catch (err) {
      console.error('❌ Fehler beim Setzen von Status "paid":', err);
    }

    localStorage.removeItem('pendingBooking'); // 🧹 Clean up
  }
});
</script>
