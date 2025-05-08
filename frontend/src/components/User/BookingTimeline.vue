<template>
  <div class="w-full">

    <!-- ✅ Nur bei Schritt 2: Bestätigungen -->
    <div v-if="step === 2" class="mb-6 bg-white dark:bg-slate-900 p-4 rounded shadow border border-slate-200 dark:border-slate-700 space-y-3 text-sm md:text-base">

      <label class="flex items-start space-x-2">
        <input
          type="checkbox"
          v-model="confirmCorrectInfo"
          class="mt-1 accent-blue-500"
        />
        <span>Ich bestätige, dass alle Angaben korrekt sind.</span>
      </label>

      <label class="flex items-start space-x-2">
        <input
          type="checkbox"
          v-model="acceptRules"
          class="mt-1 accent-blue-500"
        />
        <span>
          Ich akzeptiere die
          <button @click="showRules = true" type="button" class="underline text-blue-600 hover:text-blue-800">
            Buchungsbedingungen
          </button>.
        </span>
      </label>

      <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>

      <!-- 🔒 Modal/Popup Platzhalter (kann später schöner gemacht werden) -->
      <div v-if="showRules" class="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded text-sm space-y-2">
        <h3 class="text-base font-semibold mb-2">Buchungsbedingungen</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li>Check-in ab 13:00 Uhr, Check-out bis 12:00 Uhr.</li>
          <li>Die Buchung ist verbindlich. Stornierungen bitte rechtzeitig melden.</li>
          <li>Ruhezeiten sind von 22:00 bis 07:00 einzuhalten.</li>
          <li>Die persönlichen Daten werden ausschließlich zur Abwicklung der Buchung verwendet.</li>
        </ul>
        <button @click="showRules = false" class="mt-3 underline text-blue-600 hover:text-blue-800">Schließen</button>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-4">
      <button v-if="step > 0" @click="$emit('prev')"
        class="bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md">
        Zurück zu "{{ steps[step - 1] }}"
      </button>
      <span></span>
      <button v-if="step < steps.length - 2" :disabled="!canProceed" @click="$emit('next')"
        class="bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md">
        Weiter zu "{{ steps[step + 1] }}"
      </button>

      <!-- ✅ Zahlung: Sperre wenn nicht bestätigt -->
      <button v-else @click="handleConfirm"
        :disabled="step === 2 && !bothConfirmed"
        class="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 py-2 px-4
        rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Zur Zahlung
      </button>
    </div>

    <!-- Timeline -->
    <div class="flex justify-between items-center mb-6 py-5">
      <template v-for="(stepLabel, index) in steps" :key="index">
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
import { ref, computed } from 'vue'

const { step, canProceed } = defineProps<{
  step: number
  canProceed?: boolean,
}>()

const emit = defineEmits(['prev', 'next', 'confirm'])

const steps = [
  'Zeitraum & Fahrzeug',
  'Gästeinfos & Insassen',
  'Buchungsübersicht',
  'Zahlung',
]

// 🆕 Logik für Bestätigung
const confirmCorrectInfo = ref(false)
const acceptRules = ref(false)
const errorMessage = ref('')
const showRules = ref(false)

const bothConfirmed = computed(() => confirmCorrectInfo.value && acceptRules.value)

const handleConfirm = () => {
  if (step === 2 && !bothConfirmed.value) {
    errorMessage.value = 'Bitte bestätigen Sie alle Punkte, um fortzufahren.'
    return
  }
  emit('confirm')
}
</script>
