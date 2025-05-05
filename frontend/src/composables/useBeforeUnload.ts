// composables/useBeforeUnload.ts

import { onMounted, onBeforeUnmount, watch } from 'vue';
import { Ref } from 'vue';
import { useBooking } from './useBooking';
import { deleteBookingViaFetch } from '@/api'; // 🔁 Import aus zentraler API-Datei

export function useBeforeUnload(
  enabled: boolean | Ref<boolean> = true,
  onCleanup?: () => void
) {
  const { bookingId } = useBooking();

  const attemptDelete = () => {
    if (bookingId.value) {
      deleteBookingViaFetch(bookingId.value);
    }
    if (onCleanup) onCleanup();
  };

  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    if (typeof enabled === 'boolean' ? enabled : enabled.value) {
      event.preventDefault();
      event.returnValue = '';
      attemptDelete();
    }
  };

  const popstateHandler = () => {
    if (typeof enabled === 'boolean' ? enabled : enabled.value) {
      attemptDelete();
    }
  };

  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler);
    window.addEventListener('popstate', popstateHandler);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.removeEventListener('popstate', popstateHandler);
  });

  if (typeof enabled !== 'boolean') {
    watch(enabled, (newVal) => {
      if (newVal) {
        window.addEventListener('beforeunload', beforeUnloadHandler);
        window.addEventListener('popstate', popstateHandler);
      } else {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        window.removeEventListener('popstate', popstateHandler);
      }
    });
  }
}
