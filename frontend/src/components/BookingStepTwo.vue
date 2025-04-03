<template>
    <div class="guest-info">
  
      <!-- Buchungsinfo -->
      <div class="info-container">
        <div class="info-row">
          <DateDisplay :date="checkInDate" label="Check-in ab" />
          <span class="info-extra">13:00 Uhr</span>
        </div>
        <div class="info-row">
          <DateDisplay :date="checkOutDate" label="Check-out bis" />
          <span class="info-extra">12:00 Uhr</span>
        </div>
        <div class="info-row">
          <p><strong>Anzahl Fahrzeuge:</strong> {{ numberOfCars }}</p>
        </div>
      </div>
  
      <!-- Preisübersicht -->
      <div class="price-container">
        <p><strong>Preis (exkl. Kurtaxe):</strong> {{ priceInfo.base }} CHF</p>
        <p><strong>Kurtaxe:</strong> {{ priceInfo.tax }} CHF</p>
        <p class="total"><strong>Total:</strong> {{ priceInfo.total }} CHF</p>
      </div>
  
      <hr>
  
      <!-- Gäste-Infos -->
      <div class="guest-container">
        <h3>Gästeinformationen</h3>
  
        <div class="form-row">
          <label>Anrede:</label>
          <select v-model="guestInfo.salutation" :class="{'error-border': errorFields.includes('Anrede')}">
            <option value="">-- Bitte wählen --</option>
            <option value="Herr">Herr</option>
            <option value="Frau">Frau</option>
          </select>
        </div>
  
        <div class="form-row">
          <label>Vorname:</label>
          <input v-model="guestInfo.firstName" :class="{'error-border': errorFields.includes('Vorname')}" />
        </div>
  
        <div class="form-row">
          <label>Nachname:</label>
          <input v-model="guestInfo.lastName" :class="{'error-border': errorFields.includes('Nachname')}" />
        </div>
  
        <!-- <div class="form-row">
          <label>Nationalität:</label>
          <input v-model="guestInfo.nationality" :class="{'error-border': errorFields.includes('Nationalität')}" />
        </div> -->

        <div class="form-row">
          <label>Nationalität:</label>
          <select v-model="guestInfo.nationality" :class="{'error-border': errorFields.includes('Nationalität')}">
            <option value="">-- Bitte wählen --</option>
            <option v-for="country in countries" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
        </div>

  
        <div class="form-row">
          <label>E-Mail:</label>
          <input v-model="guestInfo.email" :class="{'error-border': errorFields.includes('E-Mail')}" />
        </div>
  
        <div class="form-row">
          <label>Telefonnummer:</label>
          <div class="phone-input">
            <select
              v-model="guestInfo.phoneCountryCode"
              class="phone-code"
              @change="manualPhoneCodeChange = true"
              :class="{'error-border': errorFields.includes('Vorwahl')}"
            >
              <option value="">-- Wählen --</option>
              <option v-for="country in countries" :key="country.code" :value="country.dialCode">
                {{ country.name }} ({{ country.dialCode }})
              </option>
            </select>

            <input
              type="text"
              v-model="guestInfo.phoneNumber"
              placeholder="79 123 45 67"
              class="phone-number"
              :class="{'error-border': errorFields.includes('Telefonnummer')}"
            />
          </div>
        </div>
      </div>
  
      <hr>
  
      <!-- Fahrzeugdaten -->
      <div v-for="(car, index) in cars" :key="index" class="car-container">
        <h3>Fahrzeug {{ index + 1 }}</h3>
  
        <div class="form-row">
          <label>Autokennzeichen:</label>
          <input v-model="car.carPlate" :class="{'error-border': errorFields.includes(`Autokennzeichen für Auto ${index + 1}`)}" />
        </div>
  
        <div class="form-row">
          <label>Gäste 0–13 Jahre:</label>
          <input type="number" min="0" v-model="car.children" :class="{'error-border': errorFields.includes(`Kinder für Auto ${index + 1}`)}" />
        </div>
  
        <div class="form-row">
          <label>Gäste 14+ Jahre:</label>
          <input type="number" min="1" v-model="car.adults" :class="{'error-border': errorFields.includes(`Erwachsene für Auto ${index + 1}`)}" />
        </div>
  
        <hr />
      </div>
  
      <!-- Weiter-Button -->
      <button @click="$emit('submit')">Weiter zur Zahlung</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  
    </div>
  </template>
  
<script setup lang="ts">
import { useBooking } from '@/composables/useBooking';
import DateDisplay from '@/components/DateDisplay.vue';
import { countries } from '@/countries';

const {
  numberOfCars,
  cars,
  guestInfo,
  errorFields,
  errorMessage,
  checkInDate,
  checkOutDate,
  priceInfo,
  manualPhoneCodeChange,
  submitBookingStepTwo,
} = useBooking();

const emit = defineEmits(['submit']);

const handleSubmit = async () => {
  const success = await submitBookingStepTwo();
  if (success) {
    emit('submit'); // ⬅️ das war bisher vermutlich nicht da
  }
};

</script>

  