// src/composables/useIdleTimer.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useIdleTimer({
  timeoutMinutes = 15,
  onTimeout,
}: {
  timeoutMinutes?: number;
  onTimeout: () => void;
}) {
  const isIdle = ref(false);
  let timeoutId: number | null = null;

  const reset = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      isIdle.value = true;
      onTimeout();
    }, timeoutMinutes * 60 * 1000);
  };

  const handleActivity = () => {
    if (isIdle.value) isIdle.value = false;
    reset();
  };

  const start = () => {
    ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
    reset();
  };

  const stop = () => {
    ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach((event) => {
      window.removeEventListener(event, handleActivity);
    });
    if (timeoutId) clearTimeout(timeoutId);
  };

  onMounted(start);
  onUnmounted(stop);

  return {
    isIdle,
    reset,
    stop,
  };
}
