// src/composables/useCheckOutPicker.ts
import { Ref, ref, computed } from 'vue';
import { formatDateToYMD, formatToCH } from './utils/dateUtils';
import type { DatePickerMarker } from '@vuepic/vue-datepicker';

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

  // 🟢 MARKERS für Tooltips vorbereiten:
  const markers = computed<DatePickerMarker[]>(() => {
    const markersList: DatePickerMarker[] = [];
  
    if (!checkInDate.value) return markersList;
  
    const start = new Date(checkInDate.value);
    const maxDate = new Date(checkInDate.value);
    maxDate.setDate(maxDate.getDate() + maxRange);
  
    const definitiveMaxDate = new Date(checkInDate.value);
    definitiveMaxDate.setDate(definitiveMaxDate.getDate() + definitiveRange.value);
  
    const endOfMonth = new Date(checkInDate.value.getFullYear(), checkInDate.value.getMonth() + 1, 0);
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    let current = new Date(start);
    current.setDate(current.getDate() + 1); // Start nach Check-in
  
    while (current <= endOfMonth) {
      // Skip Vergangenheit
      if (current < today) {
        current.setDate(current.getDate() + 1);
        continue;
      }
  
      // 🟢 1️⃣ Marker: außerhalb der definitiven Range aber innerhalb von maxRange
      if (current > definitiveMaxDate && current <= maxDate) {
        markersList.push({
          date: new Date(current),
          type: 'dot',
          color: 'grey',
          tooltip: [{
            text: 'Nicht als Check-out verfügbar',
            color: 'grey',
            options: { markDisabled: true },
          }],
        } as unknown as DatePickerMarker);
      }
  
      // 🟠 2️⃣ Marker: nach maxRange (aber nur bis Ende Monat)
      if (current > maxDate) {
        markersList.push({
          date: new Date(current),
          type: 'dot',
          color: 'grey',
          tooltip: [{
            text: `Maximale Buchungsdauer überschritten (max. ${maxRange} Nächte)`,
            color: 'grey',
            options: { markDisabled: true },
          }],
        } as unknown as DatePickerMarker);
      }
  
      current.setDate(current.getDate() + 1);
    }
  
    return markersList;
  });
  
  



  // 📏 Berechnung der maximal möglichen Range basierend auf Belegung
  const definitiveRange = computed(() => {
    if (!checkInDate.value) return maxRange;

    for (let i = 1; i <= maxRange; i++) {
      const nights = Array.from({ length: i }, (_, offset) => {
        const night = new Date(checkInDate.value!);
        night.setDate(night.getDate() + offset);
        return formatDateToYMD(night);
      });

      const isBlocked = nights.some((night) =>
        disabledYMD.value.includes(night)
      );

      if (isBlocked) return i - 1;
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
      transitions: false,
      placeholder: checkInDate.value
      ? `${formatToCH(checkInDate.value)} –`
      : 'Check-out auswählen',
    
    };
  });

  return {
    selectedRange,
    datepickerProps,
    markers,
  };
}
