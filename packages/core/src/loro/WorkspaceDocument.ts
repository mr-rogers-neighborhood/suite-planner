import { LoroDoc } from "loro-crdt";
import { err, ok, type Result } from "neverthrow";

import type { DateKey } from "../dates";
import type {
  CalendarEvent,
  DayRecord,
  FocusSession,
  Project,
  Settings,
  Tag,
  Task,
  WorkspaceMeta,
} from "../schema";
import {
  type DayRecordPatch,
  ensureDay,
  getDay,
  markDayPlanned,
  markDayShutdown,
  updateDay,
} from "./days";
import {
  type CalendarEventInput,
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from "./events";
import {
  activeFocusSession,
  endFocusSession,
  listFocusSessions,
  startFocusSession,
  updateFocusSession,
} from "./focus";
import { initializeMeta, readMeta } from "./meta";
import { getNote, getNoteText, setNote } from "./notes";
import { createProject, deleteProject, listProjects, updateProject } from "./projects";
import { ensureSettings, readSettings, updateSettings } from "./settings";
import { readWorkspaceSnapshot, type WorkspaceSnapshot } from "./snapshot";
import { createTag, deleteTag, listTags, updateTag } from "./tags";
import {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  type NewTaskInput,
  reorderTasks,
  scheduleTask,
  type TaskPatch,
  tasksForDate,
  toggleChecklistItem,
  uncompleteOccurrence,
  uncompleteTask,
  updateTask,
} from "./tasks";

/**
 * The only writer of a workspace. Every mutation validates through Zod before it commits, and
 * every field is written on its own key so concurrent edits merge instead of clobbering a record.
 */
export class WorkspaceDocument {
  readonly #doc: LoroDoc;

  private constructor(doc: LoroDoc) {
    this.#doc = doc;
  }

  static create(options: { now?: Date } = {}): WorkspaceDocument {
    const doc = new LoroDoc();
    initializeMeta(doc, options.now);
    ensureSettings(doc);
    doc.commit();
    return new WorkspaceDocument(doc);
  }

  static fromSnapshot(bytes: Uint8Array): WorkspaceDocument {
    const doc = LoroDoc.fromSnapshot(bytes);
    // A replica must not reuse the peer id baked into the snapshot, or its first edit collides
    // with the document that produced it.
    doc.setPeerId(randomPeerId());
    return new WorkspaceDocument(doc);
  }

  /** Escape hatch for the note editor, which binds a ProseMirror view to a Loro text container. */
  get loro(): LoroDoc {
    return this.#doc;
  }

  snapshot(): Uint8Array {
    this.#doc.commit();
    return this.#doc.export({ mode: "snapshot" });
  }

  observe(listener: (update: Uint8Array) => void): () => void {
    return this.#doc.subscribeLocalUpdates((bytes) => listener(bytes));
  }

  applyUpdate(update: Uint8Array): void {
    this.#doc.import(update);
  }

  getSnapshot(): WorkspaceSnapshot {
    return readWorkspaceSnapshot(this.#doc);
  }

  validate(): Result<WorkspaceSnapshot, Error> {
    try {
      return ok(this.getSnapshot());
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Tasks

  listTasks(): Task[] {
    return listTasks(this.#doc);
  }

  getTask(id: string): Task | undefined {
    return getTask(this.#doc, id);
  }

  createTask(input: NewTaskInput, now: Date = new Date()): Task {
    return createTask(this.#doc, input, now);
  }

  updateTask(id: string, patch: TaskPatch, now: Date = new Date()): Task {
    return updateTask(this.#doc, id, patch, now);
  }

  deleteTask(id: string): void {
    deleteTask(this.#doc, id);
  }

  completeTask(id: string, occurrence: DateKey | null = null, now: Date = new Date()): Task {
    return completeTask(this.#doc, id, occurrence, now);
  }

  uncompleteTask(id: string, now: Date = new Date()): Task {
    return uncompleteTask(this.#doc, id, now);
  }

  uncompleteOccurrence(id: string, occurrence: DateKey, now: Date = new Date()): Task {
    return uncompleteOccurrence(this.#doc, id, occurrence, now);
  }

  scheduleTask(id: string, dateKey: DateKey | null, now: Date = new Date()): Task {
    return scheduleTask(this.#doc, id, dateKey, now);
  }

  reorderTasks(dateKey: DateKey, orderedIds: readonly string[]): void {
    reorderTasks(this.#doc, dateKey, orderedIds);
  }

  toggleChecklistItem(taskId: string, itemId: string, now: Date = new Date()): Task {
    return toggleChecklistItem(this.#doc, taskId, itemId, now);
  }

  tasksForDate(dateKey: DateKey): Task[] {
    return tasksForDate(this.#doc, dateKey);
  }

  // Projects and tags

  listProjects(): Project[] {
    return listProjects(this.#doc);
  }

  createProject(input: { name: string; color?: string | null }, now?: Date): Project {
    return createProject(this.#doc, input, now);
  }

  updateProject(
    id: string,
    patch: Partial<Pick<Project, "name" | "color" | "archivedAt">>,
  ): Project {
    return updateProject(this.#doc, id, patch);
  }

  deleteProject(id: string): void {
    deleteProject(this.#doc, id);
  }

  listTags(): Tag[] {
    return listTags(this.#doc);
  }

  createTag(input: { name: string; color?: string | null }, now?: Date): Tag {
    return createTag(this.#doc, input, now);
  }

  updateTag(id: string, patch: Partial<Pick<Tag, "name" | "color">>): Tag {
    return updateTag(this.#doc, id, patch);
  }

  deleteTag(id: string): void {
    deleteTag(this.#doc, id);
  }

  // Calendar

  listEvents(dateKey?: DateKey): CalendarEvent[] {
    return listEvents(this.#doc, dateKey);
  }

  createEvent(input: CalendarEventInput, now?: Date): CalendarEvent {
    return createEvent(this.#doc, input, now);
  }

  updateEvent(
    id: string,
    patch: Partial<Omit<CalendarEvent, "id" | "createdAt">>,
    now?: Date,
  ): CalendarEvent {
    return updateEvent(this.#doc, id, patch, now);
  }

  deleteEvent(id: string): void {
    deleteEvent(this.#doc, id);
  }

  // Days

  getDay(dateKey: DateKey): DayRecord | undefined {
    return getDay(this.#doc, dateKey);
  }

  ensureDay(dateKey: DateKey): DayRecord {
    return ensureDay(this.#doc, dateKey);
  }

  updateDay(dateKey: DateKey, patch: DayRecordPatch): DayRecord {
    return updateDay(this.#doc, dateKey, patch);
  }

  markDayPlanned(dateKey: DateKey, now?: Date): DayRecord {
    return markDayPlanned(this.#doc, dateKey, now);
  }

  markDayShutdown(dateKey: DateKey, now?: Date): DayRecord {
    return markDayShutdown(this.#doc, dateKey, now);
  }

  // Notes

  getNote(taskId: string): string {
    return getNote(this.#doc, taskId);
  }

  setNote(taskId: string, value: string): string {
    return setNote(this.#doc, taskId, value);
  }

  getNoteText(taskId: string) {
    return getNoteText(this.#doc, taskId);
  }

  // Focus

  listFocusSessions(): FocusSession[] {
    return listFocusSessions(this.#doc);
  }

  startFocusSession(input: { taskId: string | null; plannedMinutes: number }, now?: Date) {
    return startFocusSession(this.#doc, input, now);
  }

  endFocusSession(id: string, now?: Date): FocusSession {
    return endFocusSession(this.#doc, id, now);
  }

  activeFocusSession(): FocusSession | undefined {
    return activeFocusSession(this.#doc);
  }

  updateFocusSession(
    id: string,
    patch: Partial<Pick<FocusSession, "taskId" | "plannedMinutes" | "endedAt">>,
  ): FocusSession {
    return updateFocusSession(this.#doc, id, patch);
  }

  // Settings and metadata

  getSettings(): Settings {
    return readSettings(this.#doc);
  }

  updateSettings(patch: Partial<Settings>): Settings {
    return updateSettings(this.#doc, patch);
  }

  getMeta(): WorkspaceMeta {
    return readMeta(this.#doc);
  }
}

function randomPeerId(): bigint {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value === 0n ? 1n : value;
}
