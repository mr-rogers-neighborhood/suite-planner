import { describe, expect, it } from "vitest";

import type { Task } from "../schema";
import { dayPlan } from "./dayPlan";

const options = { defaultEstimateMinutes: 30 };

function task(overrides: Partial<Task>): Task {
  return {
    id: "task_1",
    title: "Task",
    projectId: null,
    tagIds: [],
    status: "planned",
    estimateMinutes: null,
    scheduledFor: null,
    order: 0,
    dueAt: null,
    remindAt: null,
    remindedAt: null,
    recurrence: null,
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

describe("dayPlan", () => {
  it("should separate scheduled, completed, overdue and inbox tasks", () => {
    const plan = dayPlan(
      [
        task({ id: "task_a", scheduledFor: "2026-01-05", order: 1 }),
        task({ id: "task_b", scheduledFor: "2026-01-05", order: 0 }),
        task({
          id: "task_c",
          scheduledFor: "2026-01-05",
          status: "done",
          completedAt: "2026-01-05T15:00:00.000Z",
        }),
        task({ id: "task_d", scheduledFor: "2026-01-02" }),
        task({ id: "task_e", status: "inbox" }),
      ],
      "2026-01-05",
      options,
    );

    expect(plan.tasks.map((entry) => entry.task.id)).toEqual(["task_b", "task_a"]);
    expect(plan.completed.map((entry) => entry.task.id)).toEqual(["task_c"]);
    expect(plan.overdue.map((entry) => entry.id)).toEqual(["task_d"]);
    expect(plan.inboxCount).toBe(1);
  });

  it("should include an occurrence of a recurring task", () => {
    const plan = dayPlan(
      [
        task({
          id: "task_r",
          scheduledFor: "2026-01-05",
          recurrence: { frequency: "daily", interval: 1, weekdays: [], until: null },
        }),
      ],
      "2026-01-07",
      options,
    );

    expect(plan.tasks).toHaveLength(1);
    expect(plan.tasks[0]?.recurring).toBe(true);
    expect(plan.tasks[0]?.occurrence).toBe("2026-01-07");
  });

  it("should hide a completed recurring occurrence", () => {
    const plan = dayPlan(
      [
        task({
          id: "task_r",
          scheduledFor: "2026-01-05",
          recurrence: { frequency: "daily", interval: 1, weekdays: [], until: null },
          recurrenceCompletions: ["2026-01-07"],
        }),
      ],
      "2026-01-07",
      options,
    );

    expect(plan.tasks).toHaveLength(0);
    expect(plan.completed).toHaveLength(1);
  });
});
