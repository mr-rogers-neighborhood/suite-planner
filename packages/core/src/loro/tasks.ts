import type { LoroDoc } from "loro-crdt";

import type { DateKey } from "../dates";
import { createId } from "../ids";
import {
  type ChecklistItem,
  type Recurrence,
  type Task,
  type TaskStatus,
  taskSchema,
} from "../schema";
import { ROOTS } from "./constants";
import { asMap, definedEntries, readRecord, writeFields } from "./helpers";

export type NewTaskInput = {
  title: string;
  projectId?: string | null;
  tagIds?: string[];
  status?: TaskStatus;
  estimateMinutes?: number | null;
  scheduledFor?: DateKey | null;
  order?: number;
  dueAt?: string | null;
  remindAt?: string | null;
  recurrence?: Recurrence | null;
  priority?: number | null;
  source?: string | null;
  checklist?: ChecklistItem[];
};

export type TaskPatch = Partial<Omit<Task, "id" | "createdAt">>;

class TaskNotFoundError extends Error {
  constructor(readonly taskId: string) {
    super(`Task ${taskId} does not exist`);
    this.name = "TaskNotFoundError";
  }
}

export function listTasks(doc: LoroDoc): Task[] {
  const tasks: Task[] = [];
  for (const value of doc.getMap(ROOTS.tasks).values()) {
    const map = asMap(value);
    if (map) tasks.push(readRecord(taskSchema, map));
  }
  return tasks.sort(compareTasks);
}

export function getTask(doc: LoroDoc, id: string): Task | undefined {
  const map = asMap(doc.getMap(ROOTS.tasks).get(id));
  return map ? readRecord(taskSchema, map) : undefined;
}

function requireTask(doc: LoroDoc, id: string): Task {
  const task = getTask(doc, id);
  if (!task) throw new TaskNotFoundError(id);
  return task;
}

export function createTask(doc: LoroDoc, input: NewTaskInput, now: Date = new Date()): Task {
  const timestamp = now.toISOString();
  const scheduledFor = input.scheduledFor ?? null;
  const task = taskSchema.parse({
    id: createId("task"),
    title: input.title.trim(),
    projectId: input.projectId ?? null,
    tagIds: input.tagIds ?? [],
    status: input.status ?? (scheduledFor ? "planned" : "inbox"),
    estimateMinutes: input.estimateMinutes ?? null,
    scheduledFor,
    order: input.order ?? nextOrder(doc, scheduledFor),
    dueAt: input.dueAt ?? null,
    remindAt: input.remindAt ?? null,
    recurrence: input.recurrence ?? null,
    priority: input.priority ?? null,
    source: input.source ?? null,
    checklist: input.checklist ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const map = doc.getMap(ROOTS.tasks).ensureMergeableMap(task.id);
  writeFields(map, task, Object.keys(task));
  doc.commit();
  return task;
}

export function updateTask(
  doc: LoroDoc,
  id: string,
  patch: TaskPatch,
  now: Date = new Date(),
): Task {
  const current = requireTask(doc, id);
  const changes = Object.fromEntries(definedEntries(patch)) as Partial<Task>;
  const next = taskSchema.parse({ ...current, ...changes, updatedAt: now.toISOString() });
  const map = asMap(doc.getMap(ROOTS.tasks).get(id));
  if (!map) throw new TaskNotFoundError(id);
  const keys = [...Object.keys(changes), "updatedAt"];
  writeFields(map, next, keys);
  doc.commit();
  return next;
}

export function deleteTask(doc: LoroDoc, id: string): void {
  doc.getMap(ROOTS.tasks).delete(id);
  doc.commit();
}

export function completeTask(
  doc: LoroDoc,
  id: string,
  occurrence: DateKey | null = null,
  now: Date = new Date(),
): Task {
  const task = requireTask(doc, id);
  if (occurrence && task.recurrence) {
    const completions = new Set(task.recurrenceCompletions);
    completions.add(occurrence);
    return updateTask(doc, id, { recurrenceCompletions: [...completions] }, now);
  }
  return updateTask(doc, id, { status: "done", completedAt: now.toISOString() }, now);
}

export function uncompleteTask(doc: LoroDoc, id: string, now: Date = new Date()): Task {
  const task = requireTask(doc, id);
  return updateTask(
    doc,
    id,
    {
      status: task.scheduledFor ? "planned" : "inbox",
      completedAt: null,
    },
    now,
  );
}

export function uncompleteOccurrence(
  doc: LoroDoc,
  id: string,
  occurrence: DateKey,
  now: Date = new Date(),
): Task {
  const task = requireTask(doc, id);
  return updateTask(
    doc,
    id,
    { recurrenceCompletions: task.recurrenceCompletions.filter((key) => key !== occurrence) },
    now,
  );
}

export function scheduleTask(
  doc: LoroDoc,
  id: string,
  dateKey: DateKey | null,
  now: Date = new Date(),
): Task {
  const task = requireTask(doc, id);
  if (dateKey === null) {
    return updateTask(doc, id, { scheduledFor: null, status: "inbox", order: 0 }, now);
  }
  const status: TaskStatus = task.status === "done" ? "done" : "planned";
  return updateTask(
    doc,
    id,
    { scheduledFor: dateKey, status, order: nextOrder(doc, dateKey) },
    now,
  );
}

export function reorderTasks(doc: LoroDoc, dateKey: DateKey, orderedIds: readonly string[]): void {
  const root = doc.getMap(ROOTS.tasks);
  orderedIds.forEach((id, index) => {
    const map = asMap(root.get(id));
    if (!map) return;
    const task = readRecord(taskSchema, map);
    if (task.scheduledFor !== dateKey) return;
    map.set("order", index);
  });
  doc.commit();
}

export function toggleChecklistItem(
  doc: LoroDoc,
  taskId: string,
  itemId: string,
  now: Date = new Date(),
): Task {
  const task = requireTask(doc, taskId);
  const checklist = task.checklist.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  return updateTask(doc, taskId, { checklist }, now);
}

export function tasksForDate(doc: LoroDoc, dateKey: DateKey): Task[] {
  return listTasks(doc).filter((task) => task.scheduledFor === dateKey);
}

function nextOrder(doc: LoroDoc, dateKey: DateKey | null): number {
  if (dateKey === null) return 0;
  const orders = listTasks(doc)
    .filter((task) => task.scheduledFor === dateKey)
    .map((task) => task.order);
  return orders.length === 0 ? 0 : Math.max(...orders) + 1;
}

function compareTasks(a: Task, b: Task): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.createdAt.localeCompare(b.createdAt);
}
