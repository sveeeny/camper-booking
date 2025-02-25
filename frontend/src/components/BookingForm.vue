<script setup>
import { ref } from 'vue';
import axios from '@/api';
import { countries } from '@/countries'; // Importiere die Länder-Liste


// 🌟 Schritt-Verwaltung
const step = ref(1);
const numberOfSpots = ref(1);
const checkInDate = ref(new Date().toISOString().split('T')[0]);
const checkOutDate = ref(new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);
const basePricePerNight = 30;
const errorMessage = ref('');
const bookingId = ref(null);
const assignedSpots = ref([]);

// 🌟 Gäste-Informationen
const nationality = ref('');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const phoneCountryCode = ref('');
const phoneNumber = ref('');
const carPlates = ref([]);
const guestsAbove14 = ref(1);
const guestsBelow14 = ref(0);
const kurtaxePerPerson = 3;
const manualPhoneCodeChange = ref(false); // Falls der Kunde die Vorwahl manuell ändert

// 📌 Preisberechnung
const calculateBasePrice = () => {
  const nights = (new Date(checkOutDate.value) - new Date(checkInDate.value)) / (1000 * 60 * 60 * 24);
  return nights * numberOfSpots.value * basePricePerNight;
};
const calculateKurtaxe = () => guestsAbove14.value * kurtaxePerPerson;
const calculateTotalPrice = () => calculateBasePrice() + calculateKurtaxe();

import { watch } from 'vue';

watch(nationality, (newNationality) => {
  if (!manualPhoneCodeChange.value) {
    const country = countries.find(c => c.code === newNationality);
    if (country) {
      phoneCountryCode.value = country.dialCode;
    }
  }
});

// 📌 Schritt 1: Buchung
const submitBooking = async () => {
  try {
    const bookingData = {
      checkInDate: checkInDate.value,
      checkOutDate: checkOutDate.value,
      numberOfSpots: numberOfSpots.value,
    };

    const response = await axios.post('/bookings/check', bookingData);

    if (response.data.assignedSpots && response.data.assignedSpots.length > 0) {
      assignedSpots.value = response.data.assignedSpots;
      bookingId.value = response.data.bookingId;
      step.value = 2;
      errorMessage.value = '';
    } else {
      errorMessage.value = 'Leider sind keine zusammenhängenden Stellplätze mehr verfügbar.';
    }
  } catch (error) {
    console.error('Fehler bei der API:', error.response?.data || error);
    errorMessage.value = 'Fehler bei der Buchung!';
  }
};

// 📌 Schritt 2: Gäste-Daten speichern
const completeGuestInfo = async () => {
  try {
    const guestData = {
      bookingId: bookingId.value,
      nationality: nationality.value,
      lastName: lastName.value,
      firstName: firstName.value,
      email: email.value,
      phoneCountryCode: phoneCountryCode.value,
      phoneNumber: phoneNumber.value,
      carPlates: carPlates.value.filter(plate => plate),
      guestsAbove14: guestsAbove14.value,
      guestsBelow14: guestsBelow14.value,
    };

    await axios.post('/bookings/guest', guestData);
    alert('Buchung erfolgreich abgeschlossen!');
    step.value = 1;
  } catch (error) {
    errorMessage.value = 'Fehler beim Speichern der Gäste-Informationen!';
  }
};
</script>

<template>
  <div class="booking-form">
    <h2 v-if="step === 1">Stellplatz buchen</h2>
    <h2 v-if="step === 2">Gästeinformationen</h2>

    <!-- 🌟 Schritt 1: Buchung -->
    <div v-if="step === 1">
      <label>Check-in:</label>
      <input type="date" v-model="checkInDate" :min="new Date().toISOString().split('T')[0]" />

      <label>Check-out:</label>
      <input type="date" v-model="checkOutDate" :min="checkInDate" />

      <label>Anzahl Stellplätze:</label>
      <input type="number" v-model="numberOfSpots" min="1" max="5" />

      <p class="price"><strong>Kosten (exkl. Kurtaxe):</strong> {{ calculateBasePrice() }} CHF</p>

      <button @click="submitBooking">Weiter</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <!-- 🌟 Schritt 2: Gäste-Infos -->
    <div v-if="step === 2">
      <p><strong>Check-in:</strong> {{ checkInDate }}</p>
      <p><strong>Check-out:</strong> {{ checkOutDate }}</p>
      <p><strong>Stellplätze:</strong> {{ assignedSpots.join(', ') }}</p>

      <div class="price-box">
        <p><strong>Preis (exkl. Kurtaxe):</strong> {{ calculateBasePrice() }} CHF</p>
        <p><strong>Kurtaxe:</strong> {{ calculateKurtaxe() }} CHF</p>
        <p class="total"><strong>Total:</strong> {{ calculateTotalPrice() }} CHF</p>
      </div>

      <div class="input-group">
        <label>Nationalität:</label>
        <select v-model="nationality">
          <option disabled value="">Bitte wählen</option>
          <option v-for="country in countries" :key="country.code" :value="country.code">
            {{ country.name}} ({{ country.code }})
          </option>
        </select>
      </div>
      
      <div class="input-group">
        <label>Anrede:</label>
        <select v-model="salutation">
          <option value="Herr">Herr</option>
          <option value="Frau">Frau</option>
        </select>
      </div>

      <div class="input-group">
        <label>Nachname:</label>
        <input type="text" v-model="lastName" placeholder="Muster" />
      </div>

      <div class="input-group">
        <label>Vorname:</label>
        <input type="text" v-model="firstName" placeholder="Max" />
      </div>

      <div class="input-group">
        <label>Email:</label>
        <input type="email" v-model="email" />
      </div>


      
      <div class="input-group">
        <label>Telefonnummer:</label>
        <div class="phone-input">
          <!-- 📌 Dropdown für die Ländervorwahl -->
          <select v-model="phoneCountryCode" class="phone-code" @change="manualPhoneCodeChange = true">
            <option disabled value="">+Ländervorwahl</option>
            <option v-for="country in countries" :key="country.code" :value="country.dialCode">
              {{ country.name }} ({{ country.dialCode }})
            </option>
          </select>
          
          <!-- 📌 Anzeige der gewählten Vorwahl (aber editierbar entfernt) -->
          <input type="text" v-model="phoneCountryCode" class="phone-code-display" disabled />

          <!-- 📌 Eingabefeld für Telefonnummer -->
          <input type="text" v-model="phoneNumber" placeholder="79 123 45 67" class="phone-number" />
        </div>
      </div>





      <div class="input-group">
        <label>Anzahl Gäste ab 14 Jahren:</label>
        <input type="number" v-model="guestsAbove14" min="0" />
      </div>

      <div class="input-group">
        <label>Anzahl Gäste bis 14 Jahre:</label>
        <input type="number" v-model="guestsBelow14" min="0" />
      </div>

      <div class="input-group">
        <label>Auto-Nummern:</label>
        <div v-for="(spot, index) in assignedSpots" :key="spot">
          <input type="text" v-model="carPlates[index]" placeholder="Kennzeichen" />
        </div>
      </div>

      <button @click="completeGuestInfo">Weiter zur Zahlung</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.booking-form {
  max-width: 400px;
  margin: auto;
  display: flex;
  flex-direction: column;
}
.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.phone-input {
  display: flex;
}
.phone-code {
  width: 60px;
  margin-right: 5px;
}
.phone-number {
  flex-grow: 1;
}
.price-box {
  background: #f8f8f8;
  padding: 10px;
  border-radius: 5px;
  margin: 15px 0;
}
.total {
  font-size: 18px;
  font-weight: bold;
  color: #42b883;
}
button {
  background-color: #42b883;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 15px;
}
</style>
