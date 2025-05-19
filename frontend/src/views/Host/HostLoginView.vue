<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold text-center text-slate-800 dark:text-white mb-6">
        Host Login
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-Mail</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passwort</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex items-center gap-2">
          <input id="remember" type="checkbox" v-model="rememberMe" />
          <label for="remember" class="text-sm text-slate-700 dark:text-slate-300">Eingeloggt bleiben</label>
        </div>

        <p v-if="errorMessage" class="text-red-600 text-sm text-center">{{ errorMessage }}</p>

        <button
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
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
