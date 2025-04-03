// src/composables/useDatepicker.ts
import { Ref, computed } from 'vue';

function formatDateToYMD(date: Date | string): string {
  return typeof date === 'string' ? date : date.toISOString().split('T')[0];
}

export function useDatepicker(
  disabledNights: Ref<Date[]>,
  selectedDates: Ref<[Date, Date] | null>,
  isInCheckOutPhase: Ref<boolean>
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

// 💡 'YYYY-MM-DD' Strings der belegten Nächte (Check-in gesperrt)
const disabledCheckInDates = computed(() =>
  disabledNights.value.map((d) => formatDateToYMD(d))
);

// 💡 Belegte Nächte +1 Tag → Check-out gesperrt
const disabledCheckOutDates = computed(() =>
  disabledNights.value.map((d) => {
    const next = normalizeDate(new Date(d));
    next.setDate(next.getDate() + 1);
    return formatDateToYMD(next);
  })
);


  // 📦 Aktive Liste für den Datepicker – je nach Phase
  const activeDisabledDates = computed(() =>
    isInCheckOutPhase.value ? disabledCheckOutDates.value : disabledCheckInDates.value
  );

  // 📅 Wird vom Datepicker verwendet
  const isDateDisabled = (date: Date): boolean => {
    const ymd = formatDateToYMD(date);
    return activeDisabledDates.value.includes(ymd);
  };

  // 🧪 Logging nur bei Änderung der Phase
  const logCurrentState = () => {
    const phase = isInCheckOutPhase.value ? 'Check-OUT' : 'Check-IN';
    console.log(`🌀 Aktive Phase: ${phase}`);
    console.log('⛔ Check-in gesperrt an:', disabledCheckInDates.value);
    console.log('⛔ Check-out gesperrt an:', disabledCheckOutDates.value);
    console.log('🔍 Aktive Deaktivierungsliste:', activeDisabledDates.value);
  };

  // Extern aufrufbar nach z. B. @range-start
  const onPhaseChange = () => {
    logCurrentState();
  };

  // ✨ Formatierte Anzeige
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
    range: {
      noDisabledRange: false,
      minRange: 1,
      maxRange: 3,
      showLastInRange: false,
    },
    multiCalendars: { count: 0 },
    minDate: today,
    disabledDates: isDateDisabled,
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
    datepickerProps,
    formatDate,
    onPhaseChange, // ← wichtig für BookingStepOne!
  };
}
