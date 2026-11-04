import { z } from "zod";

export const SCHEMA_VERSION = 1;

const timestampSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Expected an ISO timestamp" });

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Expected a yyyy-MM-dd date" });

export const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Expected HH:MM" });

export const taskStatusSchema = z.enum(["inbox", "planned", "done"]);

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  done: z.boolean(),
});

export const recurrenceSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().int().positive().default(1),
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  until: dateKeySchema.nullable().default(null),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  projectId: z.string().nullable().default(null),
  tagIds: z.array(z.string()).default([]),
  status: taskStatusSchema.default("inbox"),
  estimateMinutes: z.number().int().positive().nullable().default(null),
  scheduledFor: dateKeySchema.nullable().default(null),
  order: z.number().default(0),
  dueAt: timestampSchema.nullable().default(null),
  remindAt: timestampSchema.nullable().default(null),
  remindedAt: timestampSchema.nullable().default(null),
  recurrence: recurrenceSchema.nullable().default(null),
  recurrenceCompletions: z.array(dateKeySchema).default([]),
  priority: z.number().int().min(1).max(3).nullable().default(null),
  source: z.string().nullable().default(null),
  checklist: z.array(checklistItemSchema).default([]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  completedAt: timestampSchema.nullable().default(null),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().nullable().default(null),
  archivedAt: timestampSchema.nullable().default(null),
  createdAt: timestampSchema,
});

export const tagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().nullable().default(null),
  createdAt: timestampSchema,
});

export const calendarEventSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    dateKey: dateKeySchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    notes: z.string().default(""),
    color: z.string().nullable().default(null),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .refine((event) => event.endTime > event.startTime, {
    message: "An event must end after it starts",
    path: ["endTime"],
  });

export const dayRecordSchema = z.object({
  dateKey: dateKeySchema,
  intention: z.string().default(""),
  shutdownNote: z.string().default(""),
  capacityMinutesOverride: z.number().int().positive().nullable().default(null),
  plannedAt: timestampSchema.nullable().default(null),
  shutdownAt: timestampSchema.nullable().default(null),
});

export const focusSessionSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().nullable().default(null),
  startedAt: timestampSchema,
  plannedMinutes: z.number().int().positive(),
  endedAt: timestampSchema.nullable().default(null),
});

export const settingsSchema = z.object({
  weekStartsOn: z.number().int().min(0).max(6).default(1),
  workdayStart: clockTimeSchema.default("09:00"),
  workdayEnd: clockTimeSchema.default("17:00"),
  dailyCapacityMinutes: z.number().int().positive().default(300),
  defaultEstimateMinutes: z.number().int().positive().default(30),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  remindersEnabled: z.boolean().default(true),
});

export const workspaceMetaSchema = z.object({
  workspaceId: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  createdAt: timestampSchema,
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type Recurrence = z.infer<typeof recurrenceSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type DayRecord = z.infer<typeof dayRecordSchema>;
export type FocusSession = z.infer<typeof focusSessionSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type WorkspaceMeta = z.infer<typeof workspaceMetaSchema>;
