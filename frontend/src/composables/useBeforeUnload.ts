import { onMounted, onBeforeUnmount, watch } from 'vue';
import { Ref } from 'vue';
import { useBookingStore } from '@/store/bookingStore';
import { deleteBookingViaFetch } from '@/api'; 

export function useBeforeUnload(
  enabled: boolean | Ref<boolean> = true,
  onCleanup?: () => void
) {
  const bookingStore = useBookingStore();

  const attemptDelete = () => {
    if (bookingStore.bookingId) {
      deleteBookingViaFetch(bookingStore.bookingId);
      localStorage.removeItem('pendingBooking'); // 🧹 zusätzlich löschen
      bookingStore.$reset();                     // 🧼 Store zurücksetzen
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

  return { removeBeforeUnload: removeListeners };
}

export async function confirmAndCancelBookingIfNeeded(message: string, next: () => void) {
  const confirmed = window.confirm(message);
  if (!confirmed) return;

  const bookingStore = useBookingStore();

  if (bookingStore.bookingId) {
    await deleteBookingViaFetch(bookingStore.bookingId);
    localStorage.removeItem('pendingBooking');
  }

  bookingStore.$reset();
  next();
}
