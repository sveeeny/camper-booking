### 🧱 Neue Version von `BookingTimeline.vue` (erweitert)

```vue
<template>
  <div class="w-full">

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-4">
      <button
        v-if="step > 0"
        @click="$emit('prev')"
        class="bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md"
      >
        Zurück zu "{{ steps[step - 1] }}"
      </button>
      <span></span>
      <button
        v-if="step < steps.length - 1"
        :disabled = "!canProceed"
        @click="$emit('next')"
        class="bg-slate-600 hover:bg-slate-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2 px-4 rounded-md"
      >
        Weiter zu "{{ steps[step + 1] }}"
      </button>
    </div>

    <!-- Timeline (wie bisher) -->
    <div class="flex justify-between items-center mb-6 py-5">
      <template v-for="(stepLabel, index) in steps" :key="index">
        <div class="flex items-center">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            :class="{
              'bg-blue-600 text-white': index <= step,
              'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-300': index > step,
            }"
          >
            <span v-if="index < step">✔</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="ml-2 text-sm font-medium text-slate-800 dark:text-slate-200 hidden sm:inline-block">
            {{ stepLabel }}
          </span>
        </div>

        <div
          v-if="index < steps.length - 1"
          class="flex-auto h-0.5 mx-2 bg-slate-300 dark:bg-slate-600"
        ></div>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  step: number
  canProceed?: boolean,
}>()

const steps = [
  'Zeitraum & Fahrzeug',
  'Gästeinfos & Insassen',
  'Buchungsübersicht',
  'Zahlung',
]
</script>