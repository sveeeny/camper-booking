<template>
    <div class="max-w-4xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Linke Seite: Formulardaten -->
      <div class="flex flex-col gap-6">
        <h3 class="text-xl font-semibold text-slate-600 dark:text-slate-300">Gastinformationen</h3>
  
        <!-- 🧑 Name -->
        <div>
          <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Name</label>
          <input
            v-model="guestInfo.lastName"
            type="text"
            class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            placeholder="Mustermann"
          />
        </div>
  
        <!-- 🌍 Nationalität -->
        <div>
          <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Nationalität</label>
          <select
            v-model="guestInfo.nationality"
            class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            <option v-for="country in countries" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
        </div>
  
        <!-- 📧 Email (optional) -->
        <div>
          <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">E-Mail (optional)</label>
          <input
            v-model="guestInfo.email"
            type="email"
            class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            placeholder="mail@example.com"
          />
        </div>
      </div>
  
      <!-- Rechte Seite: Fahrzeuge -->
      <div class="flex flex-col gap-6">
        <h3 class="text-xl font-semibold text-slate-600 dark:text-slate-300">Fahrzeuge</h3>
  
        <div v-for="(car, i) in cars" :key="i" class="border rounded-md p-4 bg-slate-50 dark:bg-slate-800">
          <div class="mb-2">
            <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Kennzeichen</label>
            <input
              v-model="car.carPlate"
              type="text"
              class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="BE 123 456"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Erwachsene</label>
              <input
                type="number"
                min="0"
                v-model="car.adults"
                class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label class="block mb-1 font-medium text-slate-600 dark:text-slate-300">Kinder</label>
              <input
                type="number"
                min="0"
                v-model="car.children"
                class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useHostBookingForm } from '@/composables/Host/useHostBookingForm'
  import { countries } from '@/countries'
  
  const { guestInfo, cars } = useHostBookingForm()
  </script>
  