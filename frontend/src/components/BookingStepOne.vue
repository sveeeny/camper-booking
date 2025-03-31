<template>
    <div>
      <h2>Buchung starten</h2>
      <label>Anzahl Fahrzeuge:</label>
      <input type="number" v-model="numberOfCarsProxy" min="1" max="5" />
  
      <label>Check-in / Check-out:</label>
      <Datepicker
      v-model="datesProxy"
      utc="preserve"
      :range="{ noDisabledRange: true, minRange: 1, maxRange: 3, showLastInRange: true, partialRange: false }"
      :multi-calendars="{ count: 1 }"
      :min-date="new Date()"
      :disabled-dates="disabledDates"
      :enable-time-picker="false"
      :hide-offset-dates="true"
      :prevent-min-max-navigation="true"
      :clearable="true"
      :always-clearable="true"
      :action-row="{ showCancel: true, showPreview: true }"
      placeholder="Check-in & Check-out auswählen"
      auto-apply
      />

  
      <p><strong>Grundpreis:</strong> {{ basePrice }} CHF</p>
      <button @click="$emit('next')">Weiter</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, computed, onMounted } from 'vue';
  import Datepicker from '@vuepic/vue-datepicker';
  import '@vuepic/vue-datepicker/dist/main.css';
  import { useBooking } from '@/composables/useBooking';
  
  const props = defineProps({
    numberOfCars: Number,
    dates: Array,
    errorMessage: String
  });
  const emits = defineEmits(['update:numberOfCars', 'update:dates', 'next']);
  
  const numberOfCarsProxy = ref(props.numberOfCars || 1);
  const datesProxy = ref(props.dates || []);
  
  watch(numberOfCarsProxy, (val) => emits('update:numberOfCars', val));
  watch(datesProxy, (val) => emits('update:dates', val));
  
  const { disabledDates, calculateBasePrice, fetchUnavailableDates } = useBooking();
  
  const basePrice = computed(() => calculateBasePrice(datesProxy.value, numberOfCarsProxy.value));
  
  onMounted(fetchUnavailableDates);
  </script>
  
  <style scoped>
  .error {
    color: red;
    margin-top: 10px;
  }
  </style>
  