<template>
  <section class="mx-auto max-w-5xl space-y-6">
    <header>
      <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Einstellungen</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Preise, Buchungsgrenzen und Check-in-Zeiten zentral verwalten.
      </p>
    </header>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- 💶 Preis- und Personenwerte -->
      <fieldset class="settings-card grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend class="settings-legend">Preise & Personenpauschalen</legend>

        <div>
          <label class="label">Personenpauschale Erwachsene pro Nacht (CHF)</label>
          <input v-model.number="settings.adultTax" type="number" step="0.1" min="0" class="input" />
        </div>

        <div>
          <label class="label">Personenpauschale Kinder pro Nacht (CHF)</label>
          <input v-model.number="settings.childTax" type="number" step="0.1" min="0" class="input" />
        </div>

        <div>
          <label class="label">Preis pro Nacht/Fahrzeug (CHF)</label>
          <input v-model.number="settings.pricePerNightPerCar" type="number" step="1" min="0" class="input" />
        </div>

        <div>
          <label class="label">Max. Gäste pro Fahrzeug</label>
          <input v-model.number="settings.maxGuestsPerCar" type="number" min="1" class="input" />
        </div>
      </fieldset>

      <!-- 📅 Buchungszeitraum -->
      <fieldset class="settings-card grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend class="settings-legend">Buchungszeitraum</legend>

        <div>
          <label class="label">Max. Tage im Voraus buchbar</label>
          <input v-model.number="settings.bookingAdvanceDays" type="number" min="1" class="input" />
        </div>

        <div>
          <label class="label">Mindestaufenthalt (Nächte)</label>
          <input v-model.number="settings.minNights" type="number" min="1" class="input" />
        </div>

        <div>
          <label class="label">Maximalaufenthalt (Nächte)</label>
          <input v-model.number="settings.maxNights" type="number" min="1" class="input" />
        </div>
      </fieldset>

      <!-- 🕐 Zeiten & Storno -->
      <fieldset class="settings-card grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend class="settings-legend">Check-in / Stornierung</legend>

        <div>
          <label class="label">Check-in Zeit</label>
          <input v-model="settings.checkInTime" type="time" class="input" />
        </div>

        <div>
          <label class="label">Check-out Zeit</label>
          <input v-model="settings.checkOutTime" type="time" class="input" />
        </div>

        <div>
          <label class="label">Kostenlose Stornierung bis (Tage)</label>
          <input v-model.number="settings.cancellationWindow" type="number" min="0" class="input" />
        </div>

        <div>
          <label class="label">Stornogebühr (CHF)</label>
          <input v-model.number="settings.cancellationFee" type="number" step="0.1" min="0" class="input" />
        </div>
      </fieldset>

      <div class="text-right">
        <button type="submit" class="w-full rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-auto">
          Speichern
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from '@/api';
import { useToast } from 'vue-toastification';

const toast = useToast();


interface Settings {
  adultTax: number;
  childTax: number;
  pricePerNightPerCar: number;
  maxGuestsPerCar: number;
  bookingAdvanceDays: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationWindow: number;
  cancellationFee: number;
}

const settings = ref<Settings>({
  adultTax: 4,
  childTax: 4,
  pricePerNightPerCar: 26,
  maxGuestsPerCar: 6,
  bookingAdvanceDays: 180,
  minNights: 1,
  maxNights: 21,
  checkInTime: '13:00',
  checkOutTime: '12:00',
  cancellationWindow: 7,
  cancellationFee: 0,
});

onMounted(async () => {
  try {
    const { data } = await axios.get('/settings');
    settings.value = data;
  } catch (err) {
    console.error('❌ Fehler beim Laden der Einstellungen:', err);
    toast.error('Einstellungen konnten nicht geladen werden.');
  }
});

const handleSubmit = async () => {
  try {
    await axios.put('/settings', settings.value);
    toast.success('Einstellungen wurden gespeichert.');
  } catch (err) {
    console.error('❌ Fehler beim Speichern der Einstellungen:', err);
    toast.error('Einstellungen konnten nicht gespeichert werden.');
  }
};
</script>

<style scoped>
.input {
  @apply mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white;
}

.settings-card {
  @apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900;
}

.settings-legend {
  @apply px-2 text-lg font-semibold text-slate-800 dark:text-slate-100;
}

.label {
  @apply block text-sm font-medium text-slate-700 dark:text-slate-300;
}
</style>
