<template>
  <div class="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto px-4 py-6">

    <!-- 🧍 Gästeformular -->
    <div class="flex-1 bg-white dark:bg-slate-900 p-6 rounded-md shadow-sm space-y-4 border border-slate-200 dark:border-slate-700">

      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">Gästeinformationen</h2>

      <!-- Anrede, Vorname, Nachname -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Anrede</label>
          <select v-model="guestInfo.salutation" :class="inputClass(errorFields.includes('Anrede'))">
            <option value="">-- Bitte wählen --</option>
            <option value="Herr">Herr</option>
            <option value="Frau">Frau</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Vorname</label>
          <input v-model="guestInfo.firstName" :class="inputClass(errorFields.includes('Vorname'))" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nachname</label>
          <input v-model="guestInfo.lastName" :class="inputClass(errorFields.includes('Nachname'))" />
        </div>
      </div>

      <!-- Nationalität und E-Mail -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nationalität</label>
          <select v-model="guestInfo.nationality" :class="inputClass(errorFields.includes('Nationalität'))">
            <option value="">-- Bitte wählen --</option>
            <option v-for="country in countries" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">E-Mail</label>
          <input v-model="guestInfo.email" :class="inputClass(errorFields.includes('E-Mail'))" />
        </div>
      </div>

      <!-- Telefonnummer -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Telefonnummer</label>
        <div class="flex gap-2 py-2 items-stretch relative min-h-[42px]">


          <Multiselect
          v-model="selectedDialCode"
          :options="dialCodes"
          :searchable="true"
          :close-on-select="true"
          :allow-empty="false"
          placeholder="Vorwahl wählen"
          track-by="dialCode"
          :custom-label="countryLabel"
          :class="['multiselect', 'w-1/2', { 'border-red-500': errorFields.includes('Vorwahl') }]"

        >
          <!-- Im Dropdown -->
          <template #option="{ option }">
            {{ option.name }} ({{ option.dialCode }})
          </template>
        
          <!-- Nach Auswahl -->
          <template #singleLabel="{ option }">
            {{ option.dialCode }}
          </template>
        </Multiselect>


          <input
            type="text"
            v-model="guestInfo.phoneNumber"
            placeholder="79 123 45 67"
            :class="inputClass(errorFields.includes('Telefonnummer')), 'w-1/2'"
            
          />
        </div>
      </div>

      <!-- Fahrzeugdaten -->
      <div v-for="(car, index) in cars" :key="index" class="mt-6 border-t pt-4">
        <h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Fahrzeug {{ index + 1 }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Autokennzeichen</label>
            <input v-model="car.carPlate" :class="inputClass(errorFields.includes(`Autokennzeichen für Auto ${index + 1}`))" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Gäste 0–13 Jahre</label>
            <input type="number" min="0" v-model="car.children" :class="inputClass(errorFields.includes(`Kinder für Auto ${index + 1}`))" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Gäste 14+ Jahre</label>
            <input type="number" min="1" v-model="car.adults" :class="inputClass(errorFields.includes(`Erwachsene für Auto ${index + 1}`))" />
          </div>
        </div>
      </div>

      <!-- Weiter Button -->
      <div class="mt-6">
        <button
          @click="handleSubmit"
          class="w-full bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md disabled:bg-slate-300 dark:disabled:bg-slate-500"
        >
          Weiter zur Buchungsübersicht
        </button>
        <p v-if="errorMessage" class="text-red-600 text-sm mt-2 text-center">
          {{ errorMessage }}
        </p>
      </div>
    </div>

    <!-- 📋 Buchungsinfos -->
    <div class="w-full md:w-1/3 flex flex-col gap-4">
      <div class="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Check-in-Daten</h3>
        <DateDisplay :date="checkInDate" label="Check-in ab" />
        <DateDisplay :date="checkOutDate" label="Check-out bis" />
        <p class="text-sm text-slate-700 dark:text-slate-300 mt-2">Anzahl Fahrzeuge: {{ numberOfCars }}</p>
      </div>

      <div class="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Preisübersicht</h3>
        <p class="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>Preis (exkl. Kurtaxe):</span>
          <span>{{ priceInfo.base }} CHF</span>
        </p>
        <p class="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>Kurtaxe:</span>
          <span>{{ priceInfo.tax }} CHF</span>
        </p>
        <hr class="my-2 border-slate-300 dark:border-slate-600" />
        <p class="flex justify-between font-semibold text-slate-800 dark:text-white">
          <span>Total:</span>
          <span>{{ priceInfo.total }} CHF</span>
        </p>
      </div>
    </div>
  </div>
</template>

  
<script setup lang="ts">
import { useBooking } from '@/composables/useBooking';
import DateDisplay from '@/components/DateDisplay.vue';
import { countries } from '@/countries';
import { computed } from 'vue';
import { onMounted, ref, watch } from 'vue';
import Multiselect from 'vue-multiselect';

defineOptions({
  components: {
    Multiselect,
  },
});





const {
  numberOfCars,
  cars,
  guestInfo,
  errorFields,
  errorMessage,
  checkInDate,
  checkOutDate,
  priceInfo,
  manualPhoneCodeChange,
  submitBookingStepTwo,
} = useBooking();

const emit = defineEmits(['submit']);

const handleSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) {
    emit('submit'); // ⬅️ das war bisher vermutlich nicht da
  }
};

const dialCodes = computed(() =>
  countries.map((c) => ({
    name: c.name,
    dialCode: c.dialCode,
  }))
)

// Lokale Auswahl für vue-multiselect
const selectedDialCode = ref<{ name: string; dialCode: string } | null>(null)

// Zwei-Wege-Bindung zur zentralen Datenstruktur
watch(selectedDialCode, (val) => {
  guestInfo.value.phoneCountryCode = val?.dialCode || ''
})

const countryLabel = (option: { name: string; dialCode: string }) => {
  // 👇 Im Dropdown: Land + Vorwahl
  return `${option.name} (${option.dialCode})`;
};



watch(() => guestInfo.value.phoneCountryCode, (newVal) => {
  const match = dialCodes.value.find((c) => c.dialCode === newVal);
  selectedDialCode.value = match || null;
});


const inputClass = (hasError: boolean) =>
  `mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
    hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
  }`;




</script>
