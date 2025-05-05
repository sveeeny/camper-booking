<template>
    <div class="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      <h3 class="text-xl font-semibold text-slate-600 dark:text-slate-300">Preis festlegen</h3>
  
      <!-- 💶 Manuelle Preisangabe -->
      <div>
        <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Gesamtpreis (CHF)</label>
        <input
          type="number"
          v-model.number="manualPrice"
          placeholder="Optional"
          class="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          min="0"
        />
      </div>
  
      <!-- 🎁 Rabatt -->
      <div>
        <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Rabatt [%]</label>
        <input
          type="number"
          v-model.number="discount"
          placeholder="Optional"
          class="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          min="0"
          max="100"
        />
      </div>
  
      <!-- 🧮 Ergebnis -->
      <div class="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded px-4 py-3">
        <p><strong>Grundpreis:</strong> {{ basePriceCHF }} CHF</p>
        <p v-if="manualPrice"><strong>Endpreis:</strong> {{ manualPrice }} CHF (manuell eingegeben)</p>
        <p v-else-if="discount">
          <strong>Endpreis:</strong> {{ discountedPrice }} CHF ({{ discount }} % Rabatt)
        </p>
        <p v-else><strong>Endpreis:</strong> {{ basePriceCHF }} CHF (ohne Rabatt)</p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useHostBookingForm } from '@/composables/Host/useHostBookingForm';
  
  const {
    basePrice,
    manualPrice,
    discount,
    setTotalPrice,
  } = useHostBookingForm();
  
  const basePriceCHF = computed(() => Math.round(basePrice.value));
  
  const discountedPrice = computed(() =>
    Math.round(basePrice.value * (1 - (discount.value || 0) / 100))
  );
  
  // 📤 Preis vor dem Abschicken setzen
  const applyPrice = () => {
    if (manualPrice.value != null && !isNaN(manualPrice.value)) {
      setTotalPrice(manualPrice.value);
    } else if (discount.value != null && !isNaN(discount.value)) {
      setTotalPrice(discountedPrice.value);
    } else {
      setTotalPrice(basePrice.value);
    }
  };
  </script>
  