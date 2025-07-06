<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-6 text-center">Host-Dashboard</h1>

    <!-- 🔐 Obere rechte Buttons -->
    <div class="flex justify-end items-center p-4 gap-2">
      <!-- ❌ Nur im Buchungsformular -->
      <button v-if="isAddBooking" @click="handleBackToDashboard"
        class="px-4 py-2 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white">
        Buchung abbrechen
      </button>

      <button @click="showToast" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
      Zeige Test-Toast
    </button>

      <!-- 🧹 Manuelles Cleanup -->
<button @click="runManualBackendCleanup"
  class="px-4 py-2 rounded-md font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
  Cleanup starten
</button>


      <!-- 🔓 Logout -->
      <button @click="handleLogout" class="px-4 py-2 rounded-md font-medium bg-slate-400 hover:bg-slate-500 text-white">
        Logout
      </button>
    </div>

    <!-- 🔘 Ansichtsauswahl – nur bei Listen-/Wochenansicht -->
    <div v-if="isListOrWeekView" class="flex justify-center gap-4 mb-6">
      <RouterLink :to="{ name: 'HostListView' }" :class="buttonClass(isRoute('HostListView'))">Tagesansicht</RouterLink>

      <RouterLink :to="{ name: 'HostWeekView' }" :class="buttonClass(isRoute('HostWeekView'))">Wochenansicht
      </RouterLink>
    </div>

    <!-- 📋 Inhalt -->
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { useBookingCleanup } from '@/composables/useBookingCleanup';
import { computed } from 'vue';
import api from '@/api';
import { useToast } from 'vue-toastification';

const toast = useToast();

const showToast = () => {
  toast.success('🎉 Toast funktioniert!');
};

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { cleanupWithPrompt } = useBookingCleanup();

const runManualBackendCleanup = async () => {
  try {
    const response = await api.patch('/bookings/manual-cleanup');
    alert(response.data.message || 'Cleanup erfolgreich gestartet');
  } catch (err) {
    console.error('❌ Fehler beim Cleanup:', err);
    alert('Fehler beim Cleanup');
  }
};

// 📍 Aktuelle Route

const currentRouteName = computed(() => route.name);

const isAddBooking = computed(() => currentRouteName.value === 'HostAddBookingView');
const isListOrWeekView = computed(() =>
  ['HostListView', 'HostWeekView'].includes(currentRouteName.value as string)
);
const isRoute = (name: string) => currentRouteName.value === name;

// 🎨 Styling für Buttons
const buttonClass = (active: boolean) =>
  `px-4 py-2 rounded-md font-medium ${active
    ? 'bg-slate-200 text-black dark:bg-slate-950 dark:text-white'
    : 'bg-slate-100 text-black dark:bg-slate-700 dark:text-white'
  }`;

// 🔁 Dashboard-Button
const handleBackToDashboard = async () => {
  await cleanupWithPrompt({
    requireConfirmation: true,
    message: 'Zurück zum Dashboard? Die Buchung wird gelöscht.',
    redirect: '/host',
  });
};

// 🔓 Logout
const handleLogout = async () => {
  await cleanupWithPrompt({
    requireConfirmation: isAddBooking.value, // ✅ Nur im Buchungsformular bestätigen
    message: 'Möchtest du dich wirklich abmelden? Offene Buchungen werden gelöscht.',
    redirect: '/login',
  });

  userStore.logout(); // 🔑 Wichtig!
};

</script>
