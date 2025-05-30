<!-- src/components/User/StepTwo.vue -->
<template>
  <div class="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto px-4 py-6">
    <!-- 🧍 Gästeformular -->
    <div
      class="flex-1 bg-white dark:bg-slate-900 p-6 rounded-md shadow-sm space-y-4 border border-slate-200 dark:border-slate-700">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">{{ t('stepTwo.title') }}</h2>

      <!-- Anrede, Vorname, Nachname -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.salutation') }}</label>
          <select v-model="guestInfo.salutation" :class="inputClass(errorFields.includes('Anrede'))">
            <option value="">{{ t('stepTwo.salutationOptions.placeholder') }}</option>
            <option value="Herr">{{ t('stepTwo.salutationOptions.mr') }}</option>
            <option value="Frau">{{ t('stepTwo.salutationOptions.ms') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.firstName') }}</label>
          <input v-model="guestInfo.firstName" placeholder="Max" :class="inputClass(errorFields.includes('Vorname'))" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.lastName') }}</label>
          <input v-model="guestInfo.lastName" placeholder="Muster"
            :class="inputClass(errorFields.includes('Nachname'))" />
        </div>
      </div>

      <!-- Nationalität & E-Mail -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.nationality.title') }}</label>
          <Multiselect v-model="guestCountry" :options="countries" track-by="code" label="name"
            :placeholder="t('stepTwo.nationality.placeholder')" :searchable="true" :close-on-select="true"
            :class="['multiselect', { 'border-red-500': errorFields.includes('Nationalität') }]" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.email') }}</label>
          <input v-model="guestInfo.email" placeholder="max.muster@provider.ch"
            :class="inputClass(errorFields.includes('E-Mail'))" />
        </div>
      </div>

      <!-- Telefonnummer -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.phone.label') }}</label>
        <div class="flex gap-2 py-2 items-stretch min-h-[42px]">
          <Multiselect v-model="guestDialCode" :options="dialCodes" :searchable="true" :close-on-select="true"
            :allow-empty="false" track-by="dialCode" :placeholder="t('stepTwo.phone.countryCode')" :custom-label="countryLabel"
            :class="['multiselect', 'w-1/2', { 'border-red-500': errorFields.includes('Vorwahl') }]" />
          <input type="text" v-model="guestInfo.phoneNumber" :placeholder="t('stepTwo.phone.placeholder')"
            :class="inputClass(errorFields.includes('Telefonnummer')) + ' w-1/2'" />
        </div>
      </div>

      <!-- Fahrzeugdaten -->
      <div v-for="(car, index) in cars" :key="index" class="mt-6 border-t pt-4">
        <h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">{{ t('stepTwo.car.title', { index: index + 1 }) }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.car.plate') }}</label>
            <input v-model="car.carPlate" placeholder="UR 12341"
              :class="inputClass(errorFields.includes(`Autokennzeichen für Auto ${index + 1}`))" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.car.children') }}</label>
            <input type="number" min="0" :max="maxChildrenForCar(index)" v-model="car.children"
              :class="inputClass(errorFields.includes(`Kinder für Auto ${index + 1}`))" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('stepTwo.car.adults') }}</label>
            <input type="number" min="1" :max="maxAdultsForCar(index)" v-model="car.adults"
              :class="inputClass(errorFields.includes(`Erwachsene für Auto ${index + 1}`))" />
          </div>
        </div>
      </div>
    </div>

    <!-- 📋 Buchungsinfos -->
    <div class="w-full md:w-1/3 flex flex-col gap-4">
      <div class="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">{{ t('stepTwo.checkin.title') }}</h3>
        <DateDisplay :date="checkInDate" :label="t('stepTwo.checkin.label')" />
        <DateDisplay :date="checkOutDate" :label="t('stepTwo.checkout.label')" />
        <h3 class="text-base text-slate-700 dark:text-slate-200 mb-2">{{ t('stepTwo.vehicles.count', { count: numberOfCars }) }}</h3>
      </div>

      <div class="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">{{ t('stepTwo.price.title') }}</h3>
        <p class="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>{{ t('stepTwo.price.base') }}</span>
          <span> CHF {{ priceInfo.base.toFixed(2) }}</span>
        </p>
        <p class="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>{{ t('stepTwo.price.tax') }}</span>
          <span> CHF {{ priceInfo.tax.toFixed(2) }}</span>
        </p>
        <hr class="my-2 border-slate-300 dark:border-slate-600" />
        <p class="flex justify-between font-semibold text-slate-800 dark:text-white">
          <span>{{ t('stepTwo.price.total') }}</span>
          <span> CHF {{ priceInfo.total.toFixed(2) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Multiselect from 'vue-multiselect';
import { useBooking } from '@/composables/useBooking';
import { useBookingStore } from '@/store/bookingStore';
import { storeToRefs } from 'pinia';
import { countries } from '@/countries';
import DateDisplay from '@/components/User/DateDisplay.vue';
import { useSettingsStore } from '@/store/settingsStore';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();

//Settings laden
const settingsStore = useSettingsStore();
const maxGuestsPerCar = computed(() => settingsStore.settings?.maxGuestsPerCar ?? 10);


const maxChildrenForCar = (carIndex: number) => {
  return Math.max(maxGuestsPerCar.value - cars.value[carIndex].adults, 0);
};

const maxAdultsForCar = (carIndex: number) => {
  return Math.max(maxGuestsPerCar.value - cars.value[carIndex].children, 1); // min 1 Erwachsener
};


const emit = defineEmits(['submit']);
const { submitBookingStepTwo, numberOfCars, cars, guestInfo, errorFields, checkInDate, checkOutDate, priceInfo } = useBooking();
const bookingStore = useBookingStore();
const { manualPhoneCodeChange } = storeToRefs(bookingStore);
const { setManualPhoneCodeChange } = bookingStore;

const handleSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) emit('submit');
};

const dialCodes = computed(() =>
  countries.map((c) => ({
    name: c.name,
    dialCode: c.dialCode,
  }))
);

const guestCountry = computed({
  get: () => countries.find((c) => c.code === guestInfo.value.nationality) || null,
  set: (val) => {
    guestInfo.value.nationality = val?.code || '';
    if (!manualPhoneCodeChange.value && val?.dialCode) {
      guestInfo.value.phoneCountryCode = val.dialCode;
    }
  },
});

const guestDialCode = computed({
  get: () => dialCodes.value.find((d) => d.dialCode === guestInfo.value.phoneCountryCode) || null,
  set: (val) => {
    guestInfo.value.phoneCountryCode = val?.dialCode || '';
    setManualPhoneCodeChange(true);
  },
});

const countryLabel = (option: { name: string; dialCode: string }) =>
  `${option.name} (${option.dialCode})`;

const inputClass = (hasError: boolean) =>
  `mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
  }`;
</script>
