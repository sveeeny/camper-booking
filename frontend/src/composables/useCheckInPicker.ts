// src/composables/useCheckInPicker.ts
import { Ref, computed, ref } from 'vue';

// 📌 Hilfsfunktion: Datum auf Mitternacht setzen (lokal)
function normalizeDate(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// 📌 Formatierfunktion: 'YYYY-MM-DD'
function formatDateToYMD(date: Date | string): string {
  return typeof date === 'string'
    ? date
    : normalizeDate(date).toISOString().split('T')[0];
}

export function useCheckInPicker(
  disabledNights: Ref<Date[]>,
  onSelected?: (date: Date) => void
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedCheckIn = ref<Date | null>(null);

  // 🟥 Diese Tage sind als Check-in blockiert
  const disabledCheckInDates = computed(() =>
    disabledNights.value.map((d) => formatDateToYMD(d))
  );

  const isDateDisabled = (date: Date): boolean => {
    const ymd = formatDateToYMD(date);
    return disabledCheckInDates.value.includes(ymd);
  };

  const onSelectCheckIn = (date: Date) => {
    selectedCheckIn.value = date;
    console.log('✅ Check-in gewählt:', formatDateToYMD(date));
    onSelected?.(date); // optionaler Callback
  };

  const resetCheckIn = () => {
    selectedCheckIn.value = null;
    console.log('♻️ Check-in wurde zurückgesetzt');
  };

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
    transitions:false,
    
  };

  return {
    selectedCheckIn,
    disabledCheckInDates,
    datepickerProps,
    onSelectCheckIn,
    resetCheckIn,
  };
}
