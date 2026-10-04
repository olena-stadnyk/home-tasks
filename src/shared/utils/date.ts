/** Календарна дата за місцевим часом у вигляді «2026-10-04». */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const longDate = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

/** «4 жовтня 2026 р.» */
export function formatLongDate(date: Date): string {
  return longDate.format(date);
}
