// src/store/bookingStore.ts
// src/store/bookingStore.ts
import { defineStore } from 'pinia';
import {
  initialBookingState,
  emptyGuestInfo,
} from '@/types';

import type {
  BookingState,
  CarsDto,
  CreateBookingGuestDto,
  BookingStatus,
  PriceInfo,
} from '@/types';

import { parseYMDStringToLocalDate } from '@/composables/utils/dateUtils';
import { useUserStore } from './userStore';


export const useBookingStore = defineStore('booking', {
  state: (): BookingState => ({ ...initialBookingState }),

  actions: {
    resetBooking() {
      Object.assign(this, initialBookingState);
    },

    setStep(step: number) {
      this.step = step;
    },

    setNumberOfCars(n: number) {
      this.numberOfCars = n;
    },

    setSelectedDates(dates: [Date, Date] | null) {
      this.selectedDates = dates;
    },

    setBookingId(id: string) {
      this.bookingId = id;
    },

    setCars(cars: CarsDto[]) {
      this.cars = cars;
    },

    initEmptyCars(checkIn: string, checkOut: string) {
      this.cars = Array.from({ length: this.numberOfCars }, () => ({
        carPlate: '',
        checkInDate: checkIn,
        checkOutDate: checkOut,
        isCancelled: false,
        adults: 1,
        children: 0,
        touristTax: 0,
      }));
    },

    setGuestInfo(guest: CreateBookingGuestDto) {
      this.guestInfo = guest;
    },


    setErrorFields(fields: string[]) {
      this.errorFields = fields;
    },

    setErrorMessage(msg: string) {
      this.errorMessage = msg;
    },

    setPriceInfo(info: PriceInfo) {
      this.priceInfo = info;
    },


    setStatus(status: BookingStatus) {
      this.status = status;
    },

    setUnavailableDates(dates: string[]) {
      this.unavailableDates = dates;
    },

    setManualPhoneCodeChange(value: boolean) {
      this.manualPhoneCodeChange = value;
    },

    initModeFromUser() {
      const userStore = useUserStore();
      console.log('🧩 initModeFromUser – user role:', userStore.role);
      const role = userStore.getEffectiveRole;
      this.mode = role === 'host' ? 'host' : 'guest';
      console.log('🧩 mode gesetzt auf:', this.mode);
    }



  },

  getters: {
    unavailableDatesAsDates: (state) => {
      return Array.isArray(state.unavailableDates)
        ? state.unavailableDates
          .filter((d): d is string => typeof d === 'string')
          .map(parseYMDStringToLocalDate)
        : [];
    }
  },
});
