<template>
  <section class="max-w-5xl mx-auto px-4 py-8 space-y-8">
    <header class="text-center">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white">
        Benutzerverwaltung
      </h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Benutzer einladen und sichere Links zum Setzen des Passworts versenden.
      </p>
    </header>

    <form
      class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      @submit.prevent="inviteUser"
    >
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
        Benutzer einladen
      </h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Der neue Benutzer erhält eine E-Mail und setzt sein Passwort selbst.
      </p>

      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
          E-Mail-Adresse
          <input
            v-model.trim="newUser.email"
            class="input"
            type="email"
            autocomplete="off"
            required
          />
        </label>

        <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Rolle
          <select v-model="newUser.role" class="input" required>
            <option value="host">Host</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          class="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="isCreating"
        >
          {{ isCreating ? 'Einladung wird versendet …' : 'Einladung senden' }}
        </button>
      </div>
    </form>

    <div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
          Bestehende Benutzer
        </h3>
        <button
          class="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60 dark:text-blue-400"
          type="button"
          :disabled="isLoading"
          @click="loadUsers"
        >
          Aktualisieren
        </button>
      </div>

      <p v-if="isLoading" class="text-sm text-slate-600 dark:text-slate-300">
        Benutzer werden geladen …
      </p>

      <p
        v-else-if="users.length === 0"
        class="rounded-md bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        Keine Benutzer gefunden.
      </p>

      <article
        v-for="user in users"
        :key="user.id"
        class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p class="font-semibold text-slate-800 dark:text-white">
              {{ user.email }}
            </p>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ roleLabel(user.role) }} · angelegt am {{ formatDate(user.createdAt) }}
            </p>
          </div>

          <button
            class="w-fit rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="resettingUserId === user.id"
            @click="sendPasswordReset(user)"
          >
            {{
              resettingUserId === user.id
                ? 'E-Mail wird versendet …'
                : 'Passwort zurücksetzen'
            }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import axios from 'axios';
import api from '@/api';
import { useToast } from 'vue-toastification';

type UserRole = 'admin' | 'host';

interface ManagedUser {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

const toast = useToast();
const users = ref<ManagedUser[]>([]);
const isLoading = ref(false);
const isCreating = ref(false);
const resettingUserId = ref<number | null>(null);
const newUser = reactive({
  email: '',
  role: 'host' as UserRole,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(' ');
  }
  return fallback;
};

const loadUsers = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get<ManagedUser[]>('/users');
    users.value = data;
  } catch (error) {
    toast.error(getErrorMessage(error, 'Benutzer konnten nicht geladen werden.'));
  } finally {
    isLoading.value = false;
  }
};

const inviteUser = async () => {
  isCreating.value = true;
  try {
    await api.post('/users/invite', {
      email: newUser.email,
      role: newUser.role,
    });
    newUser.email = '';
    newUser.role = 'host';
    toast.success('Benutzer wurde angelegt und die Einladung versendet.');
    await loadUsers();
  } catch (error) {
    toast.error(
      getErrorMessage(error, 'Einladung konnte nicht versendet werden.'),
    );
  } finally {
    isCreating.value = false;
  }
};

const sendPasswordReset = async (user: ManagedUser) => {
  const confirmed = window.confirm(
    `Soll ein neuer Passwort-Link an ${user.email} gesendet werden?`,
  );
  if (!confirmed) return;

  resettingUserId.value = user.id;
  try {
    await api.post(`/users/${user.id}/password-reset`);
    toast.success(`Der Passwort-Link wurde an ${user.email} versendet.`);
  } catch (error) {
    toast.error(
      getErrorMessage(error, 'Der Passwort-Link konnte nicht versendet werden.'),
    );
  } finally {
    resettingUserId.value = null;
  }
};

const roleLabel = (role: UserRole) =>
  role === 'admin' ? 'Administrator' : 'Host';

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' }).format(
    new Date(date),
  );

onMounted(loadUsers);
</script>

<style scoped>
.input {
  @apply mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white;
}
</style>
