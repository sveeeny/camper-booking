// src/composables/useDarkMode.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useDarkMode() {
  const isDarkMode = ref(false);

  const updateDarkMode = (e: MediaQueryListEvent | MediaQueryList) => {
    isDarkMode.value = e.matches;
  };

  let mediaQuery: MediaQueryList;

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateDarkMode(mediaQuery); // initial value
    mediaQuery.addEventListener('change', updateDarkMode);
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', updateDarkMode);
  });

  return { isDarkMode };
}
