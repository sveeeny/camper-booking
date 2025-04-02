// src/composables/useDatepicker.ts
import { Ref, ref } from 'vue';

export function useDatepicker(
    disabledDatesRef: Ref<Date[]>,
    selectedDates: Ref<[Date, Date] | null>
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  const formatDate = (dates: [Date, Date] | Date[] | null): string => {
    if (!Array.isArray(dates) || dates.length !== 2) return '';
    const [checkIn, checkOut] = dates.map((d) =>
      d.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    );
    return checkIn && checkOut ? `${checkIn} – ${checkOut}` : checkIn || '';
  };

  const datepickerProps = {
    format: formatDate,
    range: { noDisabledRange: true, minRange: 1, maxRange: 3, showLastInRange: true },
    multiCalendars: { count: 0 },
    minDate: today,
    get disabledDates() {
      return disabledDatesRef.value; // immer aktuell
    },
    enableTimePicker: false,
    hideOffsetDates: false,
    preventMinMaxNavigation: true,
    clearable: false,
    alwaysClearable: false,
    actionRow: { showCancel: true, showPreview: true },
    placeholder: 'Check-in & Check-out auswählen',
    autoApply: true,
  };

  return {
    selectedDates,
    datepickerProps,
    formatDate,
  };
}
