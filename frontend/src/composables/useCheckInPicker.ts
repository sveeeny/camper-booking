// src/composables/useCheckInPicker.ts
import { Ref, computed, ref } from 'vue';
import { formatDateToYMD, normalizeDate } from './utils/dateUtils';
import { useBooking } from '@/composables/useBooking';
import type { DatePickerMarker } from '@vuepic/vue-datepicker';
import { useSettingsStore } from '@/store/settingsStore';





/**
 * Setup für den Check-in Datepicker.
 * Blockiert Nächte aus `disabledNights` als Check-in-Daten.
 */
export function useCheckInPicker(
  disabledNights: Ref<Date[]>,
  onSelected?: (date: Date) => void
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedCheckIn = ref<Date | null>(null);

  //Settings laden
  const settingsStore = useSettingsStore();
  const bookingAdvanceDays = computed(() => settingsStore.settings?.bookingAdvanceDays ?? 180);
  const maxNights = computed(() => settingsStore.settings?.maxNights ?? 14);

  const maxCheckInDate = computed(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + bookingAdvanceDays.value - maxNights.value);
    return date;
  });


  // 🟥 Liste der deaktivierten Daten als 'YYYY-MM-DD'
  const disabledCheckInDates = computed(() =>
    disabledNights.value.map(formatDateToYMD)
  );


  const { numberOfCars } = useBooking();

  const markers = computed<DatePickerMarker[]>(() =>
    disabledNights.value.map((date) => ({
      date,
      type: 'dot',
      tooltip: [{
        text: `Kein Platz für ${numberOfCars.value} weitere Fahrzeuge`,
        color: 'red',
        options: { markDisabled: true }
      }],
    }))
  );




  // ⛔ Deaktiviert Daten, die in der Liste vorkommen
  const isDateDisabled = (date: Date): boolean => {
    const ymd = formatDateToYMD(date);
    return disabledCheckInDates.value.includes(ymd);
  };

  // ✅ Auswahl-Callback (optional)
  const onSelectCheckIn = (date: Date) => {
    selectedCheckIn.value = date;
    onSelected?.(date);
  };

  // ♻️ Reset-Funktion für externen Einsatz
  const resetCheckIn = () => {
    selectedCheckIn.value = null;
  };

  //TEST
  console.log('✅ Check-in Picker initialized', disabledCheckInDates.value);

  // 📦 Props für <Datepicker />
  const datepickerProps = {
    format: (date: Date | null): string =>
      date
        ? date.toLocaleDateString('de-CH', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
        : '',
    minDate: today,
    maxDate: maxCheckInDate.value,
    disabledDates: isDateDisabled,
    enableTimePicker: false,
    hideOffsetDates: false,
    preventMinMaxNavigation: true,
    clearable: false,
    alwaysClearable: false,
    autoApply: true,
    actionRow: { showCancel: false, showPreview: false },
    placeholder: 'Check-in auswählen',
    transitions: false,
  };

  //TEST
  console.log('Check-in Props:', datepickerProps);

  return {
    selectedCheckIn,
    datepickerProps,
    onSelectCheckIn,
    resetCheckIn,
    markers,
  };
}
