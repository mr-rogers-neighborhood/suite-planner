import type { DateKey } from "../dates";
import { addDaysToKey, differenceInDays, fromDateKey, startOfWeekKey, weekdayOf } from "../dates";
import type { Task } from "../schema";

const MAX_OCCURRENCES = 400;

/**
 * Projects a recurrence into a date range. Nothing is materialised: the task record is the only
 * stored fact, and completion is recorded per occurrence on the task itself.
 */
export function occurrencesBetween(task: Task, start: DateKey, end: DateKey): DateKey[] {
  const rule = task.recurrence;
  const anchor = task.scheduledFor;
  if (!rule || !anchor) return [];

  const limit = rule.until && rule.until < end ? rule.until : end;
  if (limit < anchor) return [];
  const from = start < anchor ? anchor : start;
  if (from > limit) return [];

  if (rule.frequency === "daily") return dailyOccurrences(from, limit, anchor, rule.interval);
  if (rule.frequency === "weekly") {
    return scanDays(from, limit, (cursor) => {
      const weeks = Math.floor(
        differenceInDays(startOfWeekKey(cursor, 1), startOfWeekKey(anchor, 1)) / 7,
      );
      if (weeks % rule.interval !== 0) return false;
      if (rule.weekdays.length === 0) return weekdayOf(cursor) === weekdayOf(anchor);
      return rule.weekdays.includes(weekdayOf(cursor));
    });
  }

  return scanDays(from, limit, (cursor) => {
    const monthOffset =
      (fromDateKey(cursor).getFullYear() - fromDateKey(anchor).getFullYear()) * 12 +
      (fromDateKey(cursor).getMonth() - fromDateKey(anchor).getMonth());
    return (
      monthOffset % rule.interval === 0 &&
      fromDateKey(cursor).getDate() === fromDateKey(anchor).getDate()
    );
  });
}

function dailyOccurrences(
  from: DateKey,
  limit: DateKey,
  anchor: DateKey,
  interval: number,
): DateKey[] {
  const offset = differenceInDays(from, anchor);
  const remainder = ((offset % interval) + interval) % interval;
  let cursor = addDaysToKey(from, remainder === 0 ? 0 : interval - remainder);
  const occurrences: DateKey[] = [];
  while (cursor <= limit && occurrences.length < MAX_OCCURRENCES) {
    occurrences.push(cursor);
    cursor = addDaysToKey(cursor, interval);
  }
  return occurrences;
}

function scanDays(from: DateKey, limit: DateKey, matches: (cursor: DateKey) => boolean): DateKey[] {
  const occurrences: DateKey[] = [];
  let cursor = from;
  while (cursor <= limit && occurrences.length < MAX_OCCURRENCES) {
    if (matches(cursor)) occurrences.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return occurrences;
}

export function isOccurrence(task: Task, dateKey: DateKey): boolean {
  return occurrencesBetween(task, dateKey, dateKey).includes(dateKey);
}

export function isOccurrenceDone(task: Task, dateKey: DateKey): boolean {
  return task.recurrenceCompletions.includes(dateKey);
}
