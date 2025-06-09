// 📁 src/composables/dateUtils.ts
export function normalizeDate(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatDateToYMD(date: Date | string): string {
  return typeof date === 'string'
    ? date
    : normalizeDate(date).toISOString().split('T')[0];
}

export function formatDateLocalYMD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 🔧 Baut bewusst ein lokales Mitternacht-Datum
export function parseYMDStringToLocalDate(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
}


// utils/dateUtils.ts
export const formatToCH = (date: Date | null): string =>
  date
    ? date.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

    // 🔧 Formatet Timestamp zu lesbarem CH-Format mit Uhrzeit
export function formatTimestamp(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
