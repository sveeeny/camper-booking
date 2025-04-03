// src/composables/useCheckInPicker.ts
import { Ref, computed, ref } from 'vue';
import { formatDateToYMD, normalizeDate } from './utils/dateUtils';

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

  // 🟥 Liste der deaktivierten Daten als 'YYYY-MM-DD'
  const disabledCheckInDates = computed(() =>
    disabledNights.value.map(formatDateToYMD)
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

  return {
    selectedCheckIn,
    datepickerProps,
    onSelectCheckIn,
    resetCheckIn,
  };
}
