// src/composables/useCheckOutPicker.ts
import { Ref, ref, computed } from 'vue';
import { formatDateToYMD, normalizeDate } from './utils/dateUtils';

/**
 * Setup für den Check-out Datepicker mit dynamischem Range-Limit.
 * Blockiert Nächte, wenn deren vorherige Nacht in `disabledNights` liegt.
 */
export function useCheckOutPicker(
  checkInDate: Ref<Date | null>,
  disabledNights: Ref<Date[]>,
  maxRange = 3
) {
  const selectedRange = ref<[Date] | [Date, Date] | null>(null);

  // 📋 Normalisierte Liste belegter Nächte als 'YYYY-MM-DD'
  const disabledYMD = computed(() =>
    disabledNights.value.map(formatDateToYMD)
  );

  // 📏 Berechnung der maximal möglichen Range basierend auf Belegung
  const definitiveRange = computed(() => {
    if (!checkInDate.value) return maxRange;

    for (let i = 1; i <= maxRange; i++) {
      const testDate = new Date(checkInDate.value);
      testDate.setDate(testDate.getDate() + i);

      const prev = new Date(testDate);
      prev.setDate(prev.getDate() - 1);
      const prevStr = formatDateToYMD(prev);

      if (disabledYMD.value.includes(prevStr)) {
        return i - 1;
      }
    }

    return maxRange;
  });

  // ⛔ Deaktiviert Daten, wenn die Nacht davor blockiert ist
  const isDateDisabled = (date: Date): boolean => {
    const ymd = formatDateToYMD(date);
    const checkInYMD = checkInDate.value ? formatDateToYMD(checkInDate.value) : null;

    // Check-in Datum soll nie deaktiviert sein
    if (checkInYMD && ymd === checkInYMD) return false;

    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const prevStr = formatDateToYMD(prev);

    return disabledYMD.value.includes(prevStr);
  };

  // 📅 Format für Anzeige im Feld (Einzeldatum)
  const formatDate = (range: unknown): string => {
    if (!Array.isArray(range) || range.length !== 2) return '';
    const [start, end] = range;
    if (!(start instanceof Date) || !(end instanceof Date)) return '';
    return `${start.toLocaleDateString('de-CH')} – ${end.toLocaleDateString('de-CH')}`;
  };
  

  // 📦 Props für <Datepicker />
  const datepickerProps = computed(() => {
    if (!checkInDate.value) return {};

    const minDate = new Date(checkInDate.value);
    const maxDate = new Date(checkInDate.value);
    maxDate.setDate(maxDate.getDate() + definitiveRange.value);

    return {
      range: {
        minRange: 1,
        maxRange: definitiveRange.value,
        showLastInRange: true,
      },
      minDate,
      maxDate,
      disabledDates: isDateDisabled,
      format: formatDate,
      enableTimePicker: false,
      hideOffsetDates: false,
      preventMinMaxNavigation: true,
      clearable: true,
      alwaysClearable: true,
      autoApply: true,
      modelAuto: false,
      actionRow: { showCancel: false, showPreview: false },
      placeholder: 'Check-out auswählen',
      transitions: false,
    };
  });

  return {
    selectedRange,
    datepickerProps,
  };
}
