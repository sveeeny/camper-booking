<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-6 text-center">Host-Dashboard</h1>

    <!-- Wenn wir uns in der "Liste" oder "Woche" befinden: Ansichtsauswahl + Inhalt -->
    <template v-if="isOverviewRoute">
      <!-- 🔘 Ansichtsauswahl -->
      <div class="flex justify-center gap-4 mb-6">
        <button @click="view = 'list'" :class="buttonClass(view === 'list')">Tagesansicht</button>
        <button @click="view = 'week'" :class="buttonClass(view === 'week')">Wochenansicht</button>
      </div>

      <!-- 📋 Inhalt -->
      <div>
        <HostBookingList v-if="view === 'list'" />
        <HostBookingWeekView v-else />
      </div>
    </template>

    <!-- 🔁 Subrouten wie /host/buchung-hinzufuegen -->
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import HostBookingList from '@/components/Host/HostBookingList.vue';
import HostBookingWeekView from '@/components/Host/HostBookingWeekView.vue';

const route = useRoute();
const view = ref<'list' | 'week'>('list');

// Prüfe, ob wir uns in der "Übersicht" befinden
const isOverviewRoute = computed(() =>
  ['HostBookingList', 'HostBookingWeekView'].includes(route.name as string)
);

// Button-Styling
const buttonClass = (active: boolean) =>
  `px-4 py-2 rounded-md font-medium ${
    active
      ? 'bg-blue-600 text-white'
      : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white'
  }`;
</script>
