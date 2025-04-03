<template>
    <div class="booking-summary">
      <h2>Buchungsübersicht</h2>
  
      <!-- 🗓️ Zeitraum -->
      <div class="info-container">
        <p><strong>Check-in:</strong> {{ checkInDateFormatted }} ab 13:00 Uhr</p>
        <p><strong>Check-out:</strong> {{ checkOutDateFormatted }} bis 12:00 Uhr</p>
        <p><strong>Anzahl Fahrzeuge:</strong> {{ numberOfCars }}</p>
      </div>
  
      <!-- 💰 Preis -->
      <div class="price-container">
        <p><strong>Grundpreis:</strong> {{ priceInfo.base }} CHF</p>
        <p><strong>Kurtaxe:</strong> {{ priceInfo.tax }} CHF</p>
        <p class="total"><strong>Total:</strong> {{ priceInfo.total }} CHF</p>
      </div>
  
      <hr />
  
      <!-- 👤 Gast -->
      <div class="guest-container">
        <h3>Gast</h3>
        <p><strong>Anrede:</strong> {{ guestInfo.salutation }}</p>
        <p><strong>Name:</strong> {{ guestInfo.firstName }} {{ guestInfo.lastName }}</p>
        <p><strong>Nationalität:</strong> {{ guestInfo.nationality }}</p>
        <p><strong>E-Mail:</strong> {{ guestInfo.email }}</p>
        <p><strong>Telefon:</strong> {{ guestInfo.phoneCountryCode }} {{ guestInfo.phoneNumber }}</p>
      </div>
  
      <hr />
  
      <!-- 🚐 Fahrzeuge -->
      <div v-for="(car, index) in cars" :key="index" class="car-container">
        <h3>Fahrzeug {{ index + 1 }}</h3>
        <p><strong>Nummernschild:</strong> {{ car.carPlate }}</p>
        <p><strong>Erwachsene:</strong> {{ car.adults }}</p>
        <p><strong>Kinder:</strong> {{ car.children }}</p>
      </div>
  
      <hr />
  
      <button @click="$emit('confirm')">Zur Zahlung</button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useBooking } from '@/composables/useBooking';
  import { computed } from 'vue';
  
  const {
    checkInDate,
    checkOutDate,
    numberOfCars,
    priceInfo,
    guestInfo,
    cars,
  } = useBooking();
  
  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleDateString('de-CH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '–';
  
  const checkInDateFormatted = computed(() => formatDate(checkInDate.value));
  const checkOutDateFormatted = computed(() => formatDate(checkOutDate.value));
  </script>
  
  <style scoped>
  .booking-summary {
    max-width: 800px;
    margin: 0 auto;
  }
  .total {
    font-weight: bold;
    margin-top: 5px;
  }
  </style>
  