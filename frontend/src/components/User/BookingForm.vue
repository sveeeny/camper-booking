<template>

<BookingOverlay v-if="showPaymentOverlay" />
  <div class="booking-form">
    <BookingStepOne v-if="step === 1" v-model:numberOfCars="numberOfCars" v-model:dates="selectedDates"
      :error-message="errorMessage" @next="handleStepOneSubmit" />

    <BookingStepTwo v-else-if="step === 2" :check-in="checkInDate" :check-out="checkOutDate"
      :number-of-cars="numberOfCars" v-model:cars="cars" v-model:guest="guestInfo" :error-fields="errorFields"
      :price-info="priceInfo" @submit="handleStepTwoSubmit" />

    <BookingSummary v-else-if="step === 3" @confirm="handleSummaryConfirm" />

  </div>

  <BookingTimeline :step="step - 1" :can-proceed="true" @next="handleNext" @prev="step--"
    @confirm="handleSummaryConfirm" />

</template>


<script setup lang="ts">
import { ref } from 'vue';
import BookingStepOne from '@/components/User/BookingStepOne.vue';
import BookingStepTwo from '@/components/User/BookingStepTwo.vue';
import BookingSummary from '@/components/User/BookingSummary.vue';
import BookingTimeline from '@/components/User/BookingTimeline.vue';
import { useBeforeUnload } from '@/composables/useBeforeUnload';
import { useBooking } from '@/composables/useBooking';
import axios from '@/api';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import BookingOverlay from './BookingOverlay.vue';
import router from '@/router';

const showPaymentOverlay = ref(false);

onMounted(() => {
  const route = useRoute();
  if (route.query.payment === 'cancelled') {
    // Hier z.B. den Step wieder auf 3 setzen oder einen Hinweis anzeigen:
    step.value = 3;
    alert('Die Zahlung wurde abgebrochen. Deine Buchung ist noch nicht abgeschlossen.');
  }
});

// 🛑 Kein überschreiben! props.mode direkt verwenden
const step = ref(1);
const warnOnUnload = ref(true);
const { removeBeforeUnload } = useBeforeUnload(warnOnUnload);


const {
  numberOfCars,
  selectedDates,
  checkInDate,
  checkOutDate,
  bookingId,
  cars,
  guestInfo,
  errorFields,
  errorMessage,
  priceInfo,
  submitBookingStepOne,
  submitBookingStepTwo,
} = useBooking();

const handleStepOneSubmit = async () => {
  const success = await submitBookingStepOne();
  if (success) step.value = 2;
};

const handleStepTwoSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) step.value = 3;
};

const handleSummaryConfirm = async () => {
  console.log('✅ Buchung bestätigt – weiter zur Zahlung');

  // ⛔ Warnung deaktivieren
  warnOnUnload.value = false;
  removeBeforeUnload();

  try {
    // Betrag berechnen (in Rappen)
    const amountInRappen = priceInfo.value.total * 100;

    const response = await axios.post('/stripe/checkout', {
      amount: amountInRappen,
      bookingId: bookingId.value,
    });

    // Stripe-Fenster öffnen
    const stripeWindow = window.open(
      response.data.url,
      'StripeCheckout',
      'width=500,height=700,menubar=no,toolbar=no,location=no,status=no'
    );

    // ✅ Overlay einblenden
    showPaymentOverlay.value = true;

    const checkStatus = async () => {
      if (stripeWindow?.closed) {
        console.log('⚠️ Stripe-Fenster wurde geschlossen');

        // Prüfe ein letztes Mal den Status (falls knapp)
        try {
          const res = await axios.get(`/bookings/${bookingId.value}/status`);
          const status = res.data.status;

          if (status === 'paid') {
            console.log('✅ Zahlung erfolgreich nach Fenster-Schließung erkannt');
            showPaymentOverlay.value = false;
            router.push('/success');
          } else {
            console.log('❌ Zahlung abgebrochen oder nicht abgeschlossen');
            showPaymentOverlay.value = false;
            alert('Die Zahlung wurde abgebrochen oder nicht abgeschlossen.');
          }
        } catch (err) {
          console.error('Fehler beim letzten Status-Check:', err);
          showPaymentOverlay.value = false;
          alert('Fehler beim Prüfen des Zahlungsstatus.');
        }

        return;
      }

      try {
        const res = await axios.get(`/bookings/${bookingId.value}/status`);
        const status = res.data.status;

        if (status === 'paid') {
          console.log('✅ Zahlung erfolgreich');
          showPaymentOverlay.value = false;
          stripeWindow?.close();
          router.push('/success');
        } else {
          console.log(`ℹ️ Status: ${status} – warte weiter...`);
          setTimeout(checkStatus, 5000); // 5 Sek Polling
        }
      } catch (err) {
        console.error('Fehler beim Status-Check:', err);
        setTimeout(checkStatus, 5000); // trotzdem weiter poll
      }
    };

    // Polling starten
    checkStatus();

  } catch (error) {
    console.error('❌ Fehler beim Starten von Stripe Checkout:', error);
    alert('Die Zahlung konnte nicht gestartet werden.');
  }
};



const handleNext = async () => {
  if (step.value === 1) {
    await handleStepOneSubmit();
  } else if (step.value === 2) {
    await handleStepTwoSubmit();
  } else {
    step.value++;
  }
};
</script>


<style scoped>
.booking-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>
