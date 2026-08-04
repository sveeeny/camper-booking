<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">

    <!-- ✅ Nur bei Schritt 2 UND nicht host/admin -->
    <div v-if="props.step === 2 && !isHostOrAdmin"
      class="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100 md:text-base">
      <label class="flex items-start space-x-2">
        <input type="checkbox" v-model="confirmCorrectInfo" class="mt-1 accent-blue-500" />
        <span>{{ t('timeline.confirmInfo') }}</span>
      </label>

      <label class="flex items-start space-x-2">
        <input type="checkbox" v-model="acceptRules" class="mt-1 accent-blue-500" />
        <span>
          {{ t('timeline.acceptRules') }}
          <button @click="showRules = true" type="button" class="p-1 underline text-blue-500 font-bold hover:text-blue-800 dark:bg-slate-600">
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
    <div class="flex items-center justify-between gap-3">
      <button v-if="step > 0" @click="$emit('prev')"
        class="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 font-medium text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70">
        {{ t('timeline.back')}}
      </button>

      <span></span>

      <!-- 🔄 Weiter-Button -->
      <button v-if="step < steps.length - 2" :disabled="!canProceed" @click="$emit('next')"
        class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
        {{ t('timeline.next')}} 
      </button>

      <!-- 🟢 Zahlung oder Speichern -->
      <button v-else @click="handleConfirm" :disabled="requiresConfirmation && !bothConfirmed"
        class="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
        {{ isHostOrAdmin ? t('timeline.confirm.host') : t('timeline.confirm.guest') }}
      </button>
    </div>

    <!-- 📍 Timeline Steps -->
    <div class="mt-4 flex items-center justify-between">
      <template v-for="(stepLabel, index) in translatedSteps" :key="index">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="{
            'bg-blue-600 text-white': index <= step,
            'bg-slate-600 text-slate-100': index > step,
          }">
            <span v-if="index < step">✔</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="ml-2 hidden text-sm font-medium text-slate-100 sm:inline-block">
            {{ stepLabel }}
          </span>
        </div>
        <div v-if="index < steps.length - 1" class="mx-2 h-0.5 flex-auto bg-slate-600"></div>
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
