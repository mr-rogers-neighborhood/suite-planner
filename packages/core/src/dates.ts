import { addDays, format, getDay, parseISO, startOfWeek } from "date-fns";

/** A local calendar day, formatted as `yyyy-MM-dd`. Never a timestamp. */
export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(key: DateKey): Date {
  return parseISO(`${key}T00:00:00`);
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = fromDateKey(key);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === key;
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), days));
}

export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function weekdayOf(key: DateKey): number {
  return getDay(fromDateKey(key));
}

export function startOfWeekKey(key: DateKey, weekStartsOn: number): DateKey {
  return toDateKey(
    startOfWeek(fromDateKey(key), { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
  );
}

export function differenceInDays(a: DateKey, b: DateKey): number {
  return Math.round((fromDateKey(a).getTime() - fromDateKey(b).getTime()) / 86_400_000);
}

export function formatClockTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function humanDayLabel(key: DateKey, today: DateKey): string {
  if (key === today) return "Today";
  if (key === addDaysToKey(today, 1)) return "Tomorrow";
  if (key === addDaysToKey(today, -1)) return "Yesterday";
  return format(fromDateKey(key), "EEE d MMM");
}
