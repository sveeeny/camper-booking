// src/composables/useBookingCleanup.ts
import { useBooking } from '@/composables/useBooking';
import { useRouter, useRoute } from 'vue-router';
import { watch, onBeforeUnmount } from 'vue';
import axios from '@/api';
import { useBookingStore } from '@/store/bookingStore';


export function useBookingCleanup(options?: {
  requireConfirmation?: boolean;
}) {
  const {
    bookingId,
  } = useBooking();

  const requireConfirmation = options?.requireConfirmation ?? false;


  const router = useRouter();
  const route = useRoute();
  const bookingStore = useBookingStore();

  // 🔍 Stripe-Flow-Check
  const isStripeFlowActive = () => localStorage.getItem('paymentInProgress') === 'true';

  const clearOnlyLocal = () => {
    clearLocalState();
  };


  // 🔥 Server-Löschung, falls erlaubt
  const cancelBookingIfNeeded = async () => {
    const id = bookingId.value;
    if (!id) return;

    try {
      const { data } = await axios.get(`/bookings/${id}`);
      if (['paid', 'cash'].includes(data.status)) return;

      if (!isStripeFlowActive()) {
        await axios.delete(`/bookings/${id}`);
        console.log('🧹 Buchung auf Server gelöscht');
      } else {
        console.log('⏳ Stripe-Vorgang aktiv – kein Server-Löschen');
      }
    } catch (err) {
      console.warn('⚠️ Konnte Buchung nicht löschen:', err);
    }
  };

  // 🔁 Lokale Daten löschen
  const clearLocalState = () => {
    localStorage.removeItem('pendingBooking');
    localStorage.removeItem('paymentInProgress');
    bookingStore.$reset(); // ✅ Store korrekt zurücksetzen
    console.log('🧹 LocalStorage und Store zurückgesetzt');
  };

  // 🖱️ Fenster- oder Tab-Wechsel
  const beforeUnloadHandler = async (e: BeforeUnloadEvent) => {
    if (isStripeFlowActive()) return;

    if (requireConfirmation) {
      e.preventDefault();
      e.returnValue = '';
    }

    await cancelBookingIfNeeded();
    clearLocalState();
  };


  window.addEventListener('beforeunload', beforeUnloadHandler);
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler));

  // 🔁 Bei Navigation auf bestimmte Views → Cleanup
  watch(() => route.name, async (newRoute) => {
    if (newRoute === 'HostListView' || newRoute === 'GuestBooking') {
      await cancelBookingIfNeeded();
      if (!isStripeFlowActive()) {
        clearLocalState();
      }
    }
  });

  // ✋ Manueller Aufruf mit Warnung (z. B. bei Button-Klick)
  const cleanupWithPrompt = async ({
    requireConfirmation = false,
    message = 'Buchung abbrechen?',
    redirect,
  }: {
    requireConfirmation?: boolean;
    message?: string;
    redirect?: string;
  }) => {
    if (requireConfirmation) {
      const confirmed = window.confirm(message);
      if (!confirmed) return;
    }

    await cancelBookingIfNeeded();
    clearLocalState();

    if (redirect) {
      router.push(redirect);
    }
  };

  return {
    cleanupWithPrompt,
    clearOnlyLocal,
  };
}
