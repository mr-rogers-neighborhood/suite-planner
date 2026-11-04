import { describe, expect, it } from "vitest";

import type { Task } from "../schema";
import { occurrencesBetween } from "./recurrence";

function recurring(overrides: Partial<Task>): Task {
  return {
    id: "task_r",
    title: "Recurring",
    projectId: null,
    tagIds: [],
    status: "planned",
    estimateMinutes: null,
    scheduledFor: "2026-01-05",
    order: 0,
    dueAt: null,
    remindAt: null,
    remindedAt: null,
    recurrence: { frequency: "daily", interval: 1, weekdays: [], until: null },
    recurrenceCompletions: [],
    priority: null,
    source: null,
    checklist: [],
    createdAt: "2026-01-05T09:00:00.000Z",
    updatedAt: "2026-01-05T09:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

describe("occurrencesBetween", () => {
  it("should return nothing for a task without a rule", () => {
    expect(occurrencesBetween(recurring({ recurrence: null }), "2026-01-05", "2026-01-10")).toEqual(
      [],
    );
  });

  it("should respect the daily interval", () => {
    const task = recurring({
      recurrence: { frequency: "daily", interval: 2, weekdays: [], until: null },
    });
    expect(occurrencesBetween(task, "2026-01-05", "2026-01-11")).toEqual([
      "2026-01-05",
      "2026-01-07",
      "2026-01-09",
      "2026-01-11",
    ]);
  });

  it("should respect weekly weekdays", () => {
    const task = recurring({
      recurrence: { frequency: "weekly", interval: 1, weekdays: [1, 3], until: null },
    });
    expect(occurrencesBetween(task, "2026-01-05", "2026-01-18")).toEqual([
      "2026-01-05",
      "2026-01-07",
      "2026-01-12",
      "2026-01-14",
    ]);
  });

  it("should skip months that do not contain the anchor day", () => {
    const task = recurring({
      scheduledFor: "2026-01-31",
      recurrence: { frequency: "monthly", interval: 1, weekdays: [], until: null },
    });
    expect(occurrencesBetween(task, "2026-01-01", "2026-04-30")).toEqual([
      "2026-01-31",
      "2026-03-31",
    ]);
  });

  it("should stop at the until date", () => {
    const task = recurring({
      recurrence: { frequency: "daily", interval: 1, weekdays: [], until: "2026-01-07" },
    });
    expect(occurrencesBetween(task, "2026-01-05", "2026-01-12")).toEqual([
      "2026-01-05",
      "2026-01-06",
      "2026-01-07",
    ]);
  });
});
