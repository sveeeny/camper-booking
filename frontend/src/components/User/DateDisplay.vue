<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  date: string | Date | null; 
  label?: string;
}

const props = defineProps<Props>();

const formattedDate = computed<string>(() => {
  if (!props.date) return '–';

  const dateObj = typeof props.date === 'string'
    ? new Date(props.date)
    : props.date;

  return dateObj.toLocaleDateString('de-CH', {
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
