<script setup lang="ts">
import { computed } from 'vue';
import { formatToCH } from '@/composables/utils/dateUtils';

const props = defineProps<{
  date: string | Date | null;
  label?: string;
}>();

const formattedDate = computed(() => {
  if (!props.date) return '–';
  try {
    const dateObj = typeof props.date === 'string' ? new Date(props.date) : props.date;
    return formatToCH(dateObj);
  } catch (e) {
    return '–';
  }
});
</script>

<template>
  <p>
    <strong v-if="label">{{ label }}:</strong>
    {{ formattedDate }}
  </p>
</template>
