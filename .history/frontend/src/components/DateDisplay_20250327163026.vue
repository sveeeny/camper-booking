<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  date: Date | null;
  label?: string;
}

const props = defineProps<Props>();

const formattedDate = computed(() => {
  if (!props.date) return '–';
  return props.date.toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});
</script>

<template>
  <p>
    <strong v-if="label">{{ label }}:</strong>
    {{ formattedDate }}
  </p>
</template>
