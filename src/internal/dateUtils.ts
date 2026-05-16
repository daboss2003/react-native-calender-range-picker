export const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function addDays(date: Date, count: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + count);
  return d;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function compareDay(a: Date, b: Date): number {
  const av = startOfDay(a).getTime();
  const bv = startOfDay(b).getTime();
  return av < bv ? -1 : av > bv ? 1 : 0;
}

export function isBeforeDay(a: Date, b: Date): boolean {
  return compareDay(a, b) < 0;
}

export function isAfterDay(a: Date, b: Date): boolean {
  return compareDay(a, b) > 0;
}

export function isBetweenDayInclusive(d: Date, start: Date, end: Date): boolean {
  return compareDay(d, start) >= 0 && compareDay(d, end) <= 0;
}

export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function weekdayOfFirst(date: Date, firstDayOfWeek: number): number {
  const wd = startOfMonth(date).getDay();
  return (wd - firstDayOfWeek + 7) % 7;
}
