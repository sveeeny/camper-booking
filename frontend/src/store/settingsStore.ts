import { defineStore } from 'pinia';
import axios from '@/api';

export interface Settings {
  adultTax: number;
  childTax: number;
  pricePerNightPerCar: number;
  maxGuestsPerCar: number;
  bookingAdvanceDays: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationWindow: number;
  cancellationFee: number;
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: null as Settings | null,
  }),

  actions: {
    async fetchSettings() {
      try {
        const response = await axios.get('/settings');
        this.settings = response.data;
      } catch (error) {
        console.error('❌ Fehler beim Laden der Settings:', error);
      }
    },
  },
});
