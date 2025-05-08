// composables/useBeforeUnload.ts

import { onMounted, onBeforeUnmount, watch } from 'vue';
import { Ref } from 'vue';
import { useBooking } from './useBooking';
import { deleteBookingViaFetch } from '@/api'; // 🔁 Import aus zentraler API-Datei

export function useBeforeUnload(
  enabled: boolean | Ref<boolean> = true,
  onCleanup?: () => void
) {
  const { bookingId, resetBookingState } = useBooking();

  const attemptDelete = () => {
    if (bookingId.value) {
      deleteBookingViaFetch(bookingId.value);
      resetBookingState();  // NEU: Frontend zurücksetzen
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

  const addListeners = () => {
    window.addEventListener('beforeunload', beforeUnloadHandler);
    window.addEventListener('popstate', popstateHandler);
  };

  const removeListeners = () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.removeEventListener('popstate', popstateHandler);
  };

  onMounted(addListeners);
  onBeforeUnmount(removeListeners);

  if (typeof enabled !== 'boolean') {
    watch(enabled, (newVal) => {
      if (newVal) {
        addListeners();
      } else {
        removeListeners();
      }
    });
  }

  // ✅ WICHTIG: Exporte die Remove-Funktion
  return { removeBeforeUnload: removeListeners };
}

export async function confirmAndCancelBookingIfNeeded(message: string, next: () => void) {
  const confirmed = window.confirm(message);
  if (!confirmed) return;

  const { cancelIncompleteBookingIfNeeded, resetBookingState } = useBooking();

  await cancelIncompleteBookingIfNeeded();   // 🗑️ Backend löschen
  resetBookingState();                       // 🔄 Frontend zurücksetzen

  next();  // Weiterleitung etc.
}
