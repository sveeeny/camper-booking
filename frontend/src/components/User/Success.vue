<template>
  <div class="max-w-2xl mx-auto text-center py-12 px-4">
    <h1 class="text-3xl font-bold text-green-600 mb-4">Vielen Dank für deine Buchung!</h1>
    <p class="text-lg text-gray-700 dark:text-slate-300 mb-6">
      {{ t('success.text') }}
    </p>

    <!-- PDF-Download (zentriert) -->
    <div class="flex justify-center mt-4">
      <a v-if="pdfToken" :href="`${API_BASE_URL}bookings/pdf-secure?token=${pdfToken}&lang=${locale}`" target="_blank" download
        class="block w-full md:w-auto text-center bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition font-medium">
        {{ t('success.download') }}
      </a>
    </div>

    <!-- Hauptseite-Link in neuer Zeile (zentriert) -->
    <div class="flex justify-center mt-6">
      <a href="https://byherger.ch" target="_blank"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-slate-800 transition">
        {{ t('success.home') }}
      </a>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import { useUserStore } from "@/store/userStore";
import { useBookingCleanup } from "@/composables/useBookingCleanup";
import { useI18n } from "vue-i18n";

const {locale} = useI18n();
const { t } = useI18n();

const route = useRoute();
const userStore = useUserStore();

const pdfToken = ref<string | null>(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isHostOrAdmin = computed(
  () => userStore.role === "host" || userStore.role === "admin"
);
const redirectPath = computed(() => (isHostOrAdmin.value ? "/host" : "/"));

const bookingId = ref<string | null>(null);
const { clearOnlyLocal } = useBookingCleanup();

onMounted(async () => {
  const id = typeof route.query.bookingId === "string" ? route.query.bookingId : null;

  if (id) {
    bookingId.value = id;

    try {
      const res = await axios.get(`${API_BASE_URL}bookings/download-token/${id}`);
      pdfToken.value = res.data.token;
    } catch (err) {
      console.error("❌ Fehler beim Token holen:", err);
    }
  } else {
    console.warn("⚠️ Keine gültige bookingId in URL-Query gefunden.");
  }

  clearOnlyLocal();
});
</script>
