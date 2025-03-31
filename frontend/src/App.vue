<script setup>
import BookingForm from './components/BookingForm.vue'; // NEU: Buchungsformular importieren
</script>

<template>
  <router-view />
  <!-- <BookingForm /> -->
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
