import { describe, expect, it } from "vitest";

import { calendarEventSchema, settingsSchema, taskSchema } from "./schema";

describe("schema", () => {
  it("should fill task defaults", () => {
    const task = taskSchema.parse({
      id: "task_1",
      title: "Write the plan",
      createdAt: "2026-01-05T09:00:00.000Z",
      updatedAt: "2026-01-05T09:00:00.000Z",
    });

    expect(task.status).toBe("inbox");
    expect(task.projectId).toBeNull();
    expect(task.scheduledFor).toBeNull();
    expect(task.tagIds).toEqual([]);
    expect(task.checklist).toEqual([]);
    expect(task.recurrenceCompletions).toEqual([]);
  });

  it("should reject a malformed date key", () => {
    expect(() =>
      taskSchema.parse({
        id: "task_1",
        title: "Bad date",
        scheduledFor: "05/01/2026",
        createdAt: "2026-01-05T09:00:00.000Z",
        updatedAt: "2026-01-05T09:00:00.000Z",
      }),
    ).toThrow();
  });

  it("should default settings to a five-hour workday", () => {
    const settings = settingsSchema.parse({});
    expect(settings.dailyCapacityMinutes).toBe(300);
    expect(settings.workdayStart).toBe("09:00");
    expect(settings.theme).toBe("system");
  });

  it("should reject an event that ends before it starts", () => {
    expect(() =>
      calendarEventSchema.parse({
        id: "event_1",
        title: "Standup",
        dateKey: "2026-01-05",
        startTime: "10:00",
        endTime: "09:00",
        createdAt: "2026-01-05T09:00:00.000Z",
        updatedAt: "2026-01-05T09:00:00.000Z",
      }),
    ).toThrow();
  });
});
