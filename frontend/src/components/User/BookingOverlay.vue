<template>
    <div
      class="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
    >
      <h1 class="text-xl font-semibold mb-4">Zahlung abgebrochen</h1>
      <p v-if="!wasClosed" class="text-center max-w-md">
        Dieses Fenster wird automatisch geschlossen.
        <br />
        Falls nicht: bitte manuell schließen.
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, ref } from 'vue'
  
  const wasClosed = ref(false)
  
  onMounted(() => {
    try {
      window.close()
      wasClosed.value = true // falls es klappt, wird Seite direkt geschlossen
    } catch (_) {
      // nichts tun – Hinweis bleibt sichtbar
    }
  })
  </script>
  