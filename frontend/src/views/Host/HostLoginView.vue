<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
    <div class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div class="bg-slate-900 px-6 py-7 text-white dark:bg-slate-800">
        <p class="text-sm font-medium uppercase tracking-[0.18em] text-blue-300">Camper Herger</p>
        <h1 class="mt-2 text-2xl font-semibold">Host-Bereich</h1>
        <p class="mt-1 text-sm text-slate-300">Melde dich an, um Buchungen zu verwalten.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5 p-6 sm:p-7">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-Mail</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passwort</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div class="flex items-center gap-2.5">
          <input id="remember" type="checkbox" v-model="rememberMe" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <label for="remember" class="text-sm text-slate-700 dark:text-slate-300">Eingeloggt bleiben</label>
        </div>

        <p v-if="errorMessage" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{{ errorMessage }}</p>

        <button
          type="submit"
          class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          Einloggen
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from '@/api';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';

const email = ref('');
const password = ref('');
const rememberMe = ref(true); // Standardmäßig aktiviert
const errorMessage = ref('');

const router = useRouter();
const userStore = useUserStore();

const handleLogin = async () => {
  errorMessage.value = '';

  try {
    const response = await axios.post('/auth/login', {
      email: email.value,
      password: password.value,
    });

    const token = response.data.access_token;
    if (!token) {
      errorMessage.value = 'Login fehlgeschlagen.';
      return;
    }

    userStore.login(token, rememberMe.value);
    router.push('/host');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Login fehlgeschlagen.';
  }
};
</script>
