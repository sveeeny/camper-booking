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
  