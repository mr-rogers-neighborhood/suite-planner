import type { DateKey } from "../dates";
import type { Task } from "../schema";
import { isOccurrence, isOccurrenceDone, occurrencesBetween } from "./recurrence";

export type DayTask = {
  task: Task;
  occurrence: DateKey;
  done: boolean;
  recurring: boolean;
};

export type DayPlan = {
  dateKey: DateKey;
  tasks: DayTask[];
  completed: DayTask[];
  overdue: Task[];
  plannedMinutes: number;
  inboxCount: number;
};

export type DayPlanOptions = {
  defaultEstimateMinutes: number;
  includeCompleted?: boolean;
};

export function dayPlan(
  tasks: readonly Task[],
  dateKey: DateKey,
  options: DayPlanOptions,
): DayPlan {
  const includeCompleted = options.includeCompleted ?? true;
  const planned: DayTask[] = [];
  const completed: DayTask[] = [];
  const overdue: Task[] = [];
  let inboxCount = 0;

  for (const task of tasks) {
    if (task.recurrence) {
      if (!isOccurrence(task, dateKey)) continue;
      const done = isOccurrenceDone(task, dateKey);
      const entry: DayTask = { task, occurrence: dateKey, done, recurring: true };
      if (done) {
        if (includeCompleted) completed.push(entry);
      } else {
        planned.push(entry);
      }
      continue;
    }

    if (task.scheduledFor === dateKey) {
      const done = task.status === "done";
      const entry: DayTask = { task, occurrence: dateKey, done, recurring: false };
      if (done) {
        if (includeCompleted) completed.push(entry);
      } else {
        planned.push(entry);
      }
      continue;
    }

    if (task.scheduledFor !== null && task.scheduledFor < dateKey && task.status !== "done") {
      overdue.push(task);
      continue;
    }

    if (task.scheduledFor === null && task.status === "inbox") inboxCount += 1;
  }

  planned.sort(
    (a, b) => a.task.order - b.task.order || a.task.createdAt.localeCompare(b.task.createdAt),
  );
  completed.sort((a, b) => (b.task.completedAt ?? "").localeCompare(a.task.completedAt ?? ""));
  overdue.sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));

  const plannedMinutes = planned.reduce(
    (total, entry) => total + (entry.task.estimateMinutes ?? options.defaultEstimateMinutes),
    0,
  );

  return { dateKey, tasks: planned, completed, overdue, plannedMinutes, inboxCount };
}

export function occurrencesInRange(task: Task, start: DateKey, end: DateKey): DateKey[] {
  return occurrencesBetween(task, start, end);
}
