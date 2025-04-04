<template>
    <div class="guest-booking">
      <h2 class="text-3xl font-bold text-center text-slate-800 dark:text-white">Buchungsformular</h2>
      <slimBookingForm />
    </div>
  </template>

<script>
import SlimBookingForm from '../components/SlimBookingForm.vue';

export default {
  components: {
    SlimBookingForm
  }
};
</script>