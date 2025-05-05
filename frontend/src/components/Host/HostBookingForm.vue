<template>
    <div class="max-w-3xl mx-auto px-4 py-6">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Manuelle Buchung</h2>
  
      
  
      <!-- 📋 Form Steps -->
      <div v-if="step === 0">
        <HostBookingStepOne @next="step++" />
      </div>
      <div v-else-if="step === 1">
        <HostBookingStepTwo @next="step++" @back="step--" />
      </div>
      <div v-else-if="step === 2">
        <HostBookingStepThree @back="step--" />
      </div>

      <!-- 🧭 Timeline -->
      <HostBookingTimeline :step="step" @next="step++" @prev="step--" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import HostBookingStepOne from './HostBookingStepOne.vue';
  import HostBookingStepTwo from './HostBookingStepTwo.vue';
  import HostBookingStepThree from './HostBookingStepThree.vue';
  import HostBookingTimeline from './HostBookingTimeline.vue';
  
  const step = ref(0);
  </script>
  