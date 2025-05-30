<template>
  <div class="w-full">

    <!-- ✅ Nur bei Schritt 2 UND nicht host/admin -->
    <div v-if="props.step === 2 && !isHostOrAdmin"
      class="mb-6 bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 space-y-3 text-sm md:text-base">
      <label class="flex items-start space-x-2">
        <input type="checkbox" v-model="confirmCorrectInfo" class="mt-1 accent-blue-500" />
        <span>{{ t('timeline.confirmInfo') }}</span>
      </label>

      <label class="flex items-start space-x-2">
        <input type="checkbox" v-model="acceptRules" class="mt-1 accent-blue-500" />
        <span>
          {{ t('timeline.acceptRules') }}
          <button @click="showRules = true" type="button" class="underline text-blue-600 hover:text-blue-800">
            {{ t('timeline.rulesButton') }}
          </button>.
        </span>
      </label>

      <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>

      <!-- 📋 Modal für Regeln -->
      <div v-if="showRules" class="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded text-sm space-y-2">
        <h3 class="text-base font-semibold mb-2">{{ t('timeline.rulesTitle') }}</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li>{{ t('timeline.rulesList.1') }}</li>
          <li>{{ t('timeline.rulesList.2') }}</li>
          <li>{{ t('timeline.rulesList.3') }}</li>
          <li>{{ t('timeline.rulesList.4') }}</li>
        </ul>
        <button @click="showRules = false" class="mt-3 underline text-blue-600 hover:text-blue-800">
           {{ t('timeline.close') }}
        </button>
      </div>
    </div>

    <!-- 🔁 Navigation Buttons -->
    <div class="flex justify-between mt-4">
      <button v-if="step > 0" @click="$emit('prev')"
        class="bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md">
        {{ t('timeline.back', { step: steps[step - 1] }) }}
      </button>

      <span></span>

      <!-- 🔄 Weiter-Button -->
      <button v-if="step < steps.length - 2" :disabled="!canProceed" @click="$emit('next')"
        class="bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md">
        {{ t('timeline.next', { step: steps[step + 1] }) }}"
      </button>

      <!-- 🟢 Zahlung oder Speichern -->
      <button v-else @click="handleConfirm" :disabled="requiresConfirmation && !bothConfirmed"
        class="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
        {{ isHostOrAdmin ? t('timeline.confirm.host') : t('timeline.confirm.guest') }}
      </button>
    </div>

    <!-- 📍 Timeline Steps -->
    <div class="flex justify-between items-center mb-6 py-5">
      <template v-for="(stepLabel, index) in translatedSteps" :key="index">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="{
            'bg-blue-600 text-white': index <= step,
            'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-300': index > step,
          }">
            <span v-if="index < step">✔</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="ml-2 text-sm font-medium text-slate-800 dark:text-slate-200 hidden sm:inline-block">
            {{ stepLabel }}
          </span>
        </div>
        <div v-if="index < steps.length - 1" class="flex-auto h-0.5 mx-2 bg-slate-300 dark:bg-slate-600"></div>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { bookingStepKeys, type BookingStepKey } from '@/constants/bookingSteps';
import { useBookingStore } from '@/store/bookingStore';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const step = computed(() => props.step); // 👈 wird weiter unten verwendet

// Übersetzte Schrittlabels als ComputedRef<string[]>
const translatedSteps = computed(() => bookingStepKeys.map((key) => t(key)));

// Aktueller Schritt als Key (optional, falls du ihn brauchst)
const currentStepLabel = computed<BookingStepKey>(() => bookingStepKeys[step.value]);

const stepKeys = bookingStepKeys;
const steps = computed(() => stepKeys.map(key => t(key)));

const { mode } = storeToRefs(useBookingStore());
const isHostOrAdmin = computed(() => mode.value === 'host');

const props = defineProps<{
  step: number;
  canProceed?: boolean;
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'confirm'): void;
}>();



const requiresConfirmation = computed(() => step.value === 2 && !isHostOrAdmin.value);

// ✅ Bestätigung für Gäste bei Schritt 2
const confirmCorrectInfo = ref(false);
const acceptRules = ref(false);
const showRules = ref(false);
const errorMessage = ref('');

const bothConfirmed = computed(() => confirmCorrectInfo.value && acceptRules.value);

const handleConfirm = () => {
  if (requiresConfirmation.value && !bothConfirmed.value) {
    errorMessage.value = 'Bitte bestätigen Sie alle Punkte, um fortzufahren.';
    return;
  }
  emit('confirm');
};
</script>
