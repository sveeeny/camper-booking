<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import axios from '@/api';
import { countries } from '@/countries';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { nextTick } from 'vue';
import { format, formatDate } from 'date-fns'
import DateDisplay from '@/components/DateDisplay.vue';

// Daten formatieren
const checkInDate = computed(() => {
  return selectedDates.value[0] ? new Date(selectedDates.value[0]) : null;
});

const checkOutDate = computed(() => {
  return selectedDates.value[1] ? new Date(selectedDates.value[1]) : null;
});


// Step1
const step = ref(1);
const numberOfCars = ref(1); // 🚀 
const selectedDates = ref([]);
const basePricePerNight = 30;
const errorMessage = ref('');
const bookingId = ref(null);
const cars = ref([]); // 🚀 
const hasSubmitted = ref(false);
const disabledDates = ref([]);
// const checkInDate = ref();
// const checkOutDate = ref();


// Step 2
const errorFields = ref([]);
const salutation = ref('');
const nationality = ref('');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const phoneCountryCode = ref('');
const phoneNumber = ref('');
const kurtaxePerAdult = 3;
const kurtaxePerChild = 0;
const manualPhoneCodeChange = ref(false);


// // 🌟 Gäste-Informationen
// const guestInfos = ref({
  // salutation = '',
  // nationality = '',
  // firstName = '',
  // lastName = '',
  // email = '',
  // phoneCountryCode = '',
  // phoneNumber = '',
  // kurtaxePerAdult = 3,
  // kurtaxePerChild = 0,
  // manualPhoneCodeChange = false,
  // hasSubmitted = false,
  // cars: []
// })




// Überprüfen ob Anzahl Stellplätze geändert wird
watch(numberOfCars, async (newValue) => {
  console.log(`🚀 Anzahl Stellplätze geändert: ${newValue}`);

  await fetchUnavailableDates(); // API neu abrufen

  selectedDates = ([]);
  console.log(`selectedDates:`, selectedDates.value[0], selectedDates.value[1]);
  await nextTick(); // Erzwinge ein UI-Update in Vue
  console.log(`📌 Aktualisierte belegte Tage:`, disabledDates.value);
});


// watch(selectedDates, async (newValue) => {
//   console.log(`🚀Neue selectedDates: ${newValue}`);
//   const checkInDate = new Date (selectedDates.value[0] || null);
//   const checkOutDate = new Date (selectedDates.value[1] || null);
//   // const checkInDate = selectedDates.value[0];
//   // const checkOutDate = selectedDates.value[1];
//   console.log(`selectedDates:`, selectedDates.value[0], selectedDates.value[1]);
//   console.log(`checkInDate:`, checkInDate);
//   console.log(`checkOutDate:`, checkOutDate);
  
//   await nextTick(); // Erzwinge ein UI-Update in Vue
//   console.log(`📌 Aktualisierte belegte Tage:`, disabledDates.value);
// });



//deaktivierte Daten aus der Datenbank holen
const fetchUnavailableDates = async () => {
  try {
    const response = await axios.get('/availability/dates', {
      params: { numberOfCars: numberOfCars.value },
    });

    console.log("📌 API Response für belegte Daten:", response.data);
    disabledDates.value = response.data.map(entry => new Date(entry.date));
    console.log("📌 Konvertierte disabledDates:", disabledDates.value);
  } catch (error) {
    console.error('❌ Fehler beim Laden der belegten Tage:', error);
  }
};

//Tabellen erstellen (später ins admin Panel verschieben)
const createTables =async () => {
  await axios.get('/tables/create', {
    });
}

// 📌 Buchung prüfen bei klick auf "Weiter"
const submitBooking = async () => {
  
  try {
    const bookingData = {
      // checkInDate: selectedDates.value[0]?.toISOString().split('T')[0] || null,
      // checkOutDate: selectedDates.value[1]?.toISOString().split('T')[0] || null,
      checkInDate: selectedDates.value[0],
      checkOutDate: selectedDates.value[1],
      numberOfCars: numberOfCars.value,
    };

    console.log("📤 Buchungsdaten senden:", JSON.stringify(bookingData, null, 2));
    const response = await axios.post('/bookings/check', bookingData);
    console.log("✅ API-Antwort erhalten:", response.data);

    if (response.data.success && response.data.bookingId) {  // 🔥 Korrektur hier!
      bookingId.value = response.data.bookingId;
      cars.value = Array.from({ length: numberOfCars.value }, () => ({
        carPlate: '',
        adults: 1,
        children: 0, 
      }));
      console.log("📌 Vorher: Schritt", step.value);
      step.value = 2;
      console.log("🚀 Nachher: Schritt", step.value);
      errorMessage.value = '';
    } else {
      errorMessage.value = 'Leider sind keine Stellplätze verfügbar.';
    }
  } catch (error) {
    console.error('❌ Fehler bei der API:', error.response?.data || error);
    errorMessage.value = 'Fehler bei der Buchung!';
  }
};


// 💰 Preisberechnung
const calculateBasePrice = () => {
  const [checkInRaw, checkOutRaw] = selectedDates.value;

  if (!checkInRaw || !checkOutRaw) return 0;

  const checkIn = new Date(checkInRaw);
  const checkOut = new Date(checkOutRaw);

  const diffTime = checkOut - checkIn;
  const nights = diffTime / (1000 * 60 * 60 * 24);

  console.log("checkIn", checkIn);
  console.log("checkOut", checkOut);
  console.log("nights", nights);

  return nights * numberOfCars.value * basePricePerNight;
};


const calculateKurtaxe = () => cars.value.reduce(
  (sum, car) => sum + (car.adults * kurtaxePerAdult) + (car.children * kurtaxePerChild), 0
);

const calculateTotalPrice = () => calculateBasePrice() + calculateKurtaxe();


// 📌 Nationalität -> Vorwahl automatisch setzen
watch(nationality, (newNationality) => {
  if (!manualPhoneCodeChange.value) {
    const country = countries.find(c => c.code === newNationality);
    if (country) {
      phoneCountryCode.value = country.dialCode;
    }
  }
});

// ✅ Echtzeit-Validierung für Gästeinformationen
watch([salutation, firstName, lastName, email, nationality, phoneCountryCode, phoneNumber], () => {
  if (!hasSubmitted.value) return;

  errorFields.value = errorFields.value.filter(field => ![
    "Anrede", "Vorname", "Nachname", "E-Mail", "Nationalität", "Vorwahl", "Telefonnummer"
  ].includes(field));

  if (!salutation.value) errorFields.value.push("Anrede");
  if (!firstName.value.trim()) errorFields.value.push("Vorname");
  if (!lastName.value.trim()) errorFields.value.push("Nachname");
  if (!email.value.trim() || !email.value.includes("@")) errorFields.value.push("E-Mail");
  if (!nationality.value) errorFields.value.push("Nationalität");
  if (!phoneCountryCode.value) errorFields.value.push("Vorwahl");
  if (phoneNumber.value.trim().length < 8 || phoneNumber.value.trim().length > 15) errorFields.value.push("Telefonnummer");
});


// 📌 Gäste-Infos speichern
const completeGuestInfo = async () => {
  hasSubmitted.value = true;
  errorFields.value = [];

  // ❌ Validierung
  if (!salutation.value) errorFields.value.push("Anrede");
  if (!firstName.value.trim()) errorFields.value.push("Vorname");
  if (!lastName.value.trim()) errorFields.value.push("Nachname");
  if (!email.value.trim() || !email.value.includes("@")) errorFields.value.push("E-Mail");
  if (!nationality.value) errorFields.value.push("Nationalität");
  if (!phoneCountryCode.value) errorFields.value.push("Vorwahl");
  if (phoneNumber.value.trim().length < 8 || phoneNumber.value.trim().length > 15) errorFields.value.push("Telefonnummer");

  cars.value.forEach((car, index) => {
    if (!car.carPlate.trim()) errorFields.value.push(`Autokennzeichen für Auto ${index + 1}`);
    if (car.adults < 1) errorFields.value.push(`Erwachsene für Auto ${index + 1}`);
    if (car.children < 0) errorFields.value.push(`Kinder für Auto ${index + 1}`);
  });

  if (errorFields.value.length > 0) {
    errorMessage.value = "❌ Bitte fülle alle Pflichtfelder korrekt aus.";
    return;
  }

  try {
    const guestData = {
      bookingId: bookingId.value,
      checkInDate: checkInDate.value,
      checkOutDate: checkOutDate.value,
      
      salutation: salutation.value,
      nationality: nationality.value,
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      phoneCountryCode: phoneCountryCode.value,
      phoneNumber: phoneNumber.value,
      cars: cars.value.map(car => ({
        carPlate: car.carPlate,
        checkInDate: checkInDate.value,
        checkOutDate: checkOutDate.value,
        
        adults: car.adults,
        children: car.children,
        touristTax: (car.adults * kurtaxePerAdult) + (car.children * kurtaxePerChild)
      })),
    };

    console.log('📤 Gäste-Infos senden:', JSON.stringify(guestData, null, 2));
    await axios.post('/bookings/guest', guestData);
    alert('Buchung erfolgreich abgeschlossen!');
    step.value = 1;
  } catch (error) {
    errorMessage.value = 'Fehler beim Speichern der Gäste-Informationen!';
  }
};


// 🚀 Belegte Tage abrufen, wenn die Seite geladen wird
onMounted(fetchUnavailableDates);

</script>


<template>
  <div class="booking-form">
    <button v-if="step===1" @click="createTables"> create tables </button>
    <h2 v-if="step === 1">Buchungsformular</h2>
    <h2 v-if="step === 1">Camper Stellplätze byherger</h2>
    <!-- <h2 v-if="step === 2">Gästeinformationen</h2> -->

    <!-- 🌟 Schritt 1: Buchung -->
    <div v-if="step === 1">
 
      <label>Anzahl Stellplätze: </label>
      <input type="number" v-model="numberOfCars" min="1" max="5" />

      <p><strong>Check-In / Check-Out</strong></p>
      


      <Datepicker 
        v-model="selectedDates"
        utc= "preserve"
        :range="{ noDisabledRange: true, minRange: 1, maxRange: 3, showLastInRange: true, partialRange: false }"
        :multi-calendars="{ count: 1 }"
        :min-date="new Date()" 
        :disabled-dates="disabledDates"  
        :enable-time-picker="false" 
        :ignore-time-validation="true"
        :hide-offset-dates="true"
        :prevent-min-max-navigation="true"
        :clearable="true"
        :always-clearable="true"
        :action-row="{ showCancel: true, showPreview: true }"  
        placeholder="Check-in & Check-out auswählen" 
        auto-apply
      />
      <p class="price"><strong>Kosten (exkl. Kurtaxe):</strong> {{ calculateBasePrice() }} CHF</p>

      <button @click="submitBooking">Weiter</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    
    </div>



<!-- 🌟 Schritt 2: Gäste-Infos -->

<div v-if="step === 2" class="guest-info">
   <div class="calendar-container"> 
<!-- HIER FEHLER: -->
  <!-- <p><strong>Check-in:</strong> {{ formatDateTime(checkInDate, 'Check-in') }}</p>
  <p><strong>Check-out:</strong> {{ formatDateTime(checkOutDate, 'Check-out') }}</p> -->
  <DateDisplay :date="checkInDate" label="Check-in" />
  <DateDisplay :date="checkOutDate" label="Check-out" />
  
  
  + <p><strong>Stellplätze:</strong> {{ numberOfCars }}</p>
   
   </div>



  <div class="price-container">
    <p><strong>Preis (exkl. Kurtaxe):</strong> {{ calculateBasePrice() }} CHF</p>
    <p><strong>Kurtaxe:</strong> {{ calculateKurtaxe() }} CHF</p>
    <p class="total"><strong>Total:</strong> {{ calculateTotalPrice() }} CHF</p>
  </div>
 

<hr>

  <!-- 🏷️ Persönliche Daten -->
  <div class="guest-container">
  <h3>Gästeinformationen</h3>
  <div class="form-row">
    <label>Anrede:</label>
    <select v-model="salutation" :class="{'error-border': errorFields.includes('Anrede')}">
      <option value="">-- Bitte wählen --</option>
      <option value="Herr">Herr</option>
      <option value="Frau">Frau</option>
    </select>
  </div>

  <div class="form-row">
    <label>Vorname:</label>
    <input type="text" v-model="firstName" placeholder="Max" :class="{'error-border': errorFields.includes('Vorname')}" />
  </div>

  <div class="form-row">
    <label>Nachname:</label>
    <input type="text" v-model="lastName" placeholder="Mustermann" :class="{'error-border': errorFields.includes('Nachname')}" />
  </div>

  <div class="form-row">
    <label>Nationalität:</label>
    <select v-model="nationality" :class="{'error-border': errorFields.includes('Nationalität')}">
      <option v-for="country in countries" :key="country.code" :value="country.code">
        {{ country.name }}
      </option>
    </select>
  </div>

  <div class="form-row">
    <label>E-Mail:</label>
    <input type="email" v-model="email" placeholder="max@example.com" :class="{'error-border': errorFields.includes('E-Mail')}" />
  </div>

  <!-- 📞 Telefonnummer -->
  <div class="form-row">
    <label>Telefonnummer:</label>
    <div class="phone-input">
      <select v-model="phoneCountryCode" class="phone-code" :class="{'error-border': errorFields.includes('Vorwahl')}">
        <option v-for="country in countries" :key="country.code" :value="country.dialCode">
          {{ country.name }} ({{ country.dialCode }})
        </option>
      </select>
      <input type="text" v-model="phoneNumber" placeholder="79 123 45 67" class="phone-number" :class="{'error-border': errorFields.includes('Telefonnummer')}" />
    </div>
  </div>
</div>
  <hr> <!-- Trennstrich -->

  <div v-for="(car, index) in cars" :key="index" class="car-container">
    <h3>Fahrzeug {{ index + 1 }}</h3>

    <div class="form-row">
      <label>Autokennzeichen:</label>
      <input type="text" v-model="car.carPlate" :class="{'error-border': errorFields.includes(`Autokennzeichen für Stellplatz ${index + 1}`)}" placeholder="ZH 12345" />
    </div>

    <div class="form-row">
      <label>Gäste 0-13 Jahre:</label>
      <input type="number" v-model="car.children" min="0" :class="{'error-border': errorFields.includes(`Gäste 0-13 für Stellplatz ${index + 1}`)}" placeholder="0" />
    </div>

    <div class="form-row">
      <label>Gäste 14+ Jahre:</label>
      <input type="number" v-model="car.adults"  :class="{'error-border': errorFields.includes(`Gäste 14+ für Stellplatz ${index + 1}`)}" placeholder="1" />
    </div>
    
    <hr> <!-- Trennstrich -->
  </div>





  <!-- 🔥 Dynamische Felder für jeden Stellplatz -->
    <!-- <div v-for="(spot, index) in assignedSpots" :key="index" class="spot-container">
    <h3>Stellplatz {{ index + 1 }}</h3>

    <div class="form-row">
      <label>Autokennzeichen:</label>
      <input type="text" v-model="spot.carPlate" :class="{'error-border': errorFields.includes(`Autokennzeichen für Stellplatz ${index + 1}`)}" placeholder="ZH 12345" />
    </div>

    <div class="form-row">
      <label>Gäste 0-13 Jahre:</label>
      <input type="number" v-model="spot.guestsBelow14" min="0" :class="{'error-border': errorFields.includes(`Gäste 0-13 für Stellplatz ${index + 1}`)}" placeholder="0" />
    </div>

    <div class="form-row">
      <label>Gäste 14+ Jahre:</label>
      <input type="number" v-model="spot.guestsAbove14"  :class="{'error-border': errorFields.includes(`Gäste 14+ für Stellplatz ${index + 1}`)}" placeholder="1" />
    </div>
    
    <hr>  Trennstrich 
  </div> -->

  <hr> <!-- Trennstrich -->

  <button @click="completeGuestInfo">Weiter zur Zahlung</button>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</div>



  </div>
</template>

