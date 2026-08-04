<template>
  <main class="min-h-screen flex items-center justify-center bg-slate-100 px-4 dark:bg-slate-900">
    <section class="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
      <h1 class="text-center text-2xl font-semibold text-slate-800 dark:text-white">
        Passwort setzen
      </h1>

      <div v-if="isComplete" class="mt-6 text-center">
        <p class="text-emerald-700 dark:text-emerald-400">
          Dein Passwort wurde erfolgreich gesetzt.
        </p>
        <RouterLink
          class="mt-5 inline-block rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
          to="/login"
        >
          Zum Login
        </RouterLink>
      </div>

      <form v-else class="mt-6 space-y-4" @submit.prevent="setPassword">
        <p class="text-sm text-slate-600 dark:text-slate-300">
          Wähle ein persönliches Passwort mit mindestens acht Zeichen.
        </p>

        <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Neues Passwort
          <input
            v-model="password"
            class="input"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Passwort bestätigen
          <input
            v-model="passwordConfirmation"
            class="input"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <p v-if="errorMessage" class="text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button
          class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="isSubmitting || !token"
        >
          {{ isSubmitting ? 'Wird gespeichert …' : 'Passwort speichern' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import axios from 'axios';
import api from '@/api';

const route = useRoute();
const token = typeof route.query.token === 'string' ? route.query.token : '';
const password = ref('');
const passwordConfirmation = ref('');
const errorMessage = ref(token ? '' : 'Der Passwort-Link ist unvollständig.');
const isSubmitting = ref(false);
const isComplete = ref(false);

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return 'Das Passwort konnte nicht gesetzt werden.';
};

const setPassword = async () => {
  errorMessage.value = '';
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Die beiden Passwörter stimmen nicht überein.';
    return;
  }

  isSubmitting.value = true;
  try {
    await api.post('/auth/password-reset/confirm', {
      token,
      password: password.value,
    });
    password.value = '';
    passwordConfirmation.value = '';
    isComplete.value = true;
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.input {
  @apply mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white;
}
</style>
