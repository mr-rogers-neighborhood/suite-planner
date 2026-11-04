import { describe, expect, it } from "vitest";

import type { Task } from "../schema";
import { capacityFor } from "./capacity";

function task(estimateMinutes: number | null): Task {
  return {
    id: `task_${estimateMinutes}`,
    title: "Task",
    projectId: null,
    tagIds: [],
    status: "planned",
    estimateMinutes,
    scheduledFor: "2026-01-05",
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
  };
}

describe("capacityFor", () => {
  it("should be empty with no planned work", () => {
    const capacity = capacityFor([], 300, 30);
    expect(capacity.state).toBe("empty");
    expect(capacity.remainingMinutes).toBe(300);
  });

  it("should apply the default estimate when a task has none", () => {
    const capacity = capacityFor([task(null), task(30)], 300, 30);
    expect(capacity.plannedMinutes).toBe(60);
    expect(capacity.state).toBe("comfortable");
  });

  it("should warn when the day is tight", () => {
    const capacity = capacityFor([task(150), task(120)], 300, 30);
    expect(capacity.state).toBe("tight");
    expect(capacity.ratio).toBeCloseTo(0.9);
  });

  it("should flag an overbooked day", () => {
    const capacity = capacityFor([task(240), task(120)], 300, 30);
    expect(capacity.state).toBe("over");
    expect(capacity.remainingMinutes).toBe(-60);
  });
});
