<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
      Admin-Einstellungen
    </h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 💶 Preis- und Personenwerte -->
      <fieldset class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend class="col-span-full text-lg font-semibold text-slate-700 dark:text-slate-200">Preise & Personenpauschalen</legend>

        <div>
          <label class="block text-sm font-medium">Personenpauschale Erwachsene pro Nacht (CHF)</label>
          <input v-model.number="settings.adultTax" type="number" step="0.1" min="0" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Personenpauschale Kinder pro Nacht (CHF)</label>
          <input v-model.number="settings.childTax" type="number" step="0.1" min="0" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Preis pro Nacht/Fahrzeug (CHF)</label>
          <input v-model.number="settings.pricePerNightPerCar" type="number" step="1" min="0" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Max. Gäste pro Fahrzeug</label>
          <input v-model.number="settings.maxGuestsPerCar" type="number" min="1" class="input" />
        </div>
      </fieldset>

      <!-- 📅 Buchungszeitraum -->
      <fieldset class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend class="col-span-full text-lg font-semibold text-slate-700 dark:text-slate-200">Buchungszeitraum</legend>

        <div>
          <label class="block text-sm font-medium">Max. Tage im Voraus buchbar</label>
          <input v-model.number="settings.bookingAdvanceDays" type="number" min="1" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Mindestaufenthalt (Nächte)</label>
          <input v-model.number="settings.minNights" type="number" min="1" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Maximalaufenthalt (Nächte)</label>
          <input v-model.number="settings.maxNights" type="number" min="1" class="input" />
        </div>
      </fieldset>

      <!-- 🕐 Zeiten & Storno -->
      <fieldset class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend class="col-span-full text-lg font-semibold text-slate-700 dark:text-slate-200">Check-in / Stornierung</legend>

        <div>
          <label class="block text-sm font-medium">Check-in Zeit</label>
          <input v-model="settings.checkInTime" type="time" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Check-out Zeit</label>
          <input v-model="settings.checkOutTime" type="time" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Kostenlose Stornierung bis (Tage)</label>
          <input v-model.number="settings.cancellationWindow" type="number" min="0" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium">Stornogebühr (CHF)</label>
          <input v-model.number="settings.cancellationFee" type="number" step="0.1" min="0" class="input" />
        </div>
      </fieldset>

      <div class="text-center mt-6">
        <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Speichern
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from '@/api';


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
  }
});

const handleSubmit = async () => {
  try {
    await axios.put('/settings', settings.value);
    alert('✅ Einstellungen erfolgreich gespeichert');
  } catch (err) {
    console.error('❌ Fehler beim Speichern der Einstellungen:', err);
    alert('Fehler beim Speichern');
  }
};
</script>

<style scoped>
.input {
  @apply mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-slate-300 dark:border-slate-600;
}
</style>
