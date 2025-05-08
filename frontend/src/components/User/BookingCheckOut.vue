<template>
    <div class="text-center mt-8">
      <button @click="startStripeCheckout" class="px-4 py-2 bg-green-600 text-white rounded">
        💳 Jetzt bezahlen (Test)
      </button>
    </div>
  </template>
  
  <script setup lang="ts">
  import axios from '@/api';
  
  const startStripeCheckout = async () => {
    try {
      const response = await axios.post('/stripe/checkout', {
        amount: 9500, // Betrag in **Rappen** (CHF 95.00)
      });
  
      // Weiterleitung zu Stripe
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Fehler beim Starten von Stripe Checkout:', error);
      alert('Zahlung konnte nicht gestartet werden.');
    }
  };
  </script>
  