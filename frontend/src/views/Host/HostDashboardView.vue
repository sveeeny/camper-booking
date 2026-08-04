<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div class="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <header class="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 dark:border-slate-800">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Camper Herger
            </p>
            <h1 class="mt-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
              Host-Bereich
            </h1>
          </div>

          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            @click="handleLogout"
          >
            Abmelden
          </button>
        </div>

        <nav class="grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap sm:items-center sm:p-4" aria-label="Host-Navigation">
          <RouterLink :to="{ name: 'HostListView' }" :class="navLinkClass('HostListView')">
            Tagesansicht
          </RouterLink>
          <RouterLink :to="{ name: 'HostWeekView' }" :class="navLinkClass('HostWeekView')">
            Wochenansicht
          </RouterLink>
          <RouterLink :to="{ name: 'HostAddBookingView' }" :class="navLinkClass('HostAddBookingView')">
            Buchung hinzufügen
          </RouterLink>

          <template v-if="userStore.isAdmin">
            <RouterLink :to="{ name: 'AdminSettingsView' }" :class="navLinkClass('AdminSettingsView')">
              Einstellungen
            </RouterLink>
            <RouterLink :to="{ name: 'AdminUsersView' }" :class="navLinkClass('AdminUsersView')">
              Benutzer
            </RouterLink>

            <details class="relative col-span-2 sm:ml-auto">
              <summary class="nav-link cursor-pointer list-none border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Wartung
              </summary>
              <div class="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <p class="font-semibold text-slate-900 dark:text-white">Temporäre Buchungen bereinigen</p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Entfernt abgelaufene, nicht abgeschlossene Buchungen.
                </p>
                <button
                  type="button"
                  class="mt-4 w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  @click="runManualBackendCleanup"
                >
                  Cleanup starten
                </button>
              </div>
            </details>
          </template>
        </nav>

        <div v-if="isAddBooking" class="border-t border-slate-200 px-4 py-3 text-right dark:border-slate-800">
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            @click="handleBackToDashboard"
          >
            Buchung abbrechen
          </button>
        </div>
      </header>

      <main class="mt-5">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import api from '@/api';
import { useBookingCleanup } from '@/composables/useBookingCleanup';
import { useUserStore } from '@/store/userStore';

const route = useRoute();
const toast = useToast();
const userStore = useUserStore();
const { cleanupWithPrompt } = useBookingCleanup();

const currentRouteName = computed(() => String(route.name ?? ''));
const isAddBooking = computed(() => currentRouteName.value === 'HostAddBookingView');

const navLinkClass = (routeName: string) => [
  'nav-link',
  currentRouteName.value === routeName
    ? 'bg-blue-600 text-white shadow-sm'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
];

const runManualBackendCleanup = async () => {
  const confirmed = window.confirm(
    'Sollen abgelaufene, nicht abgeschlossene Buchungen jetzt bereinigt werden?',
  );
  if (!confirmed) return;

  try {
    const response = await api.patch('/bookings/manual-cleanup');
    toast.success(response.data.message || 'Cleanup erfolgreich abgeschlossen.');
  } catch {
    toast.error('Cleanup konnte nicht ausgeführt werden.');
  }
};

const handleBackToDashboard = async () => {
  await cleanupWithPrompt({
    requireConfirmation: true,
    message: 'Zurück zur Übersicht? Die angefangene Buchung wird gelöscht.',
    redirect: '/host',
  });
};

const handleLogout = async () => {
  await cleanupWithPrompt({
    requireConfirmation: isAddBooking.value,
    message: 'Möchtest du dich wirklich abmelden? Offene Buchungen werden gelöscht.',
    redirect: '/login',
  });
  userStore.logout();
};
</script>

<style scoped>
.nav-link {
  @apply rounded-lg px-3 py-2 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}
</style>
