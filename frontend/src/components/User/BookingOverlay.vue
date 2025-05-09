<template>
  <div
    class="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white z-50"
  >
    <div v-if="status === 'processing'" class="text-center">
      <h2 class="text-2xl mb-4">Zahlungsvorgang läuft...</h2>
      <p class="text-sm">Bitte schließe den Vorgang im Zahlungsfenster ab.</p>
    </div>

    <div v-else-if="status === 'cancelled'" class="text-center">
      <h2 class="text-xl font-semibold mb-4">Zahlung abgebrochen</h2>
      <p v-if="!wasClosed" class="text-center max-w-md text-sm">
        Dieses Fenster wird automatisch geschlossen.
        <br />
        Falls nicht: bitte manuell schließen.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  status: 'processing' | 'cancelled';
}>();

const wasClosed = ref(false);

watch(
  () => props.status,
  (newStatus) => {
    if (newStatus === 'cancelled') {
      try {
        window.close();
        wasClosed.value = true;
      } catch (_) {
        // nichts tun, Hinweis bleibt sichtbar
      }
    }
  },
);

onMounted(() => {
  // Falls das Overlay direkt mit "cancelled" angezeigt wird:
  if (props.status === 'cancelled') {
    try {
      window.close();
      wasClosed.value = true;
    } catch (_) {
      // nichts tun
    }
  }
});
</script>
