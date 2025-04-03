// useCheckOutPicker.ts
import { Ref, ref, computed } from 'vue';

function normalizeDate(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateToYMD(date: Date | string): string {
  return typeof date === 'string'
    ? date
    : normalizeDate(date).toISOString().split('T')[0];
}

export function useCheckOutPicker(
  checkInDate: Ref<Date | null>,
  disabledNights: Ref<Date[]>,
  maxRange = 3
) {
  const selectedRange = ref<[Date, Date] | null>(null);

  const disabledYMD = computed(() =>
    disabledNights.value.map((d) => formatDateToYMD(d))
  );

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

  const isDateDisabled = (date: Date): boolean => {
    const ymd = formatDateToYMD(date);
    const checkInYMD = checkInDate.value ? formatDateToYMD(checkInDate.value) : null;
  
    if (checkInYMD && ymd === checkInYMD) {
      return false;
    }
  
    const prev = normalizeDate(new Date(date));
    prev.setDate(prev.getDate() - 1);
    const prevStr = formatDateToYMD(prev);
  
    return disabledYMD.value.includes(prevStr);
  };
  
  

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const datepickerProps = computed(() => {
    if (!checkInDate.value) return {};

    const minDate = new Date(checkInDate.value);
    minDate.setDate(minDate.getDate());

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
