import { capacityFor, type Task } from "@gradient/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CapacityMeter, capacityLabel } from "./CapacityMeter";

function task(estimateMinutes: number): Task {
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

describe("capacityLabel", () => {
  it("should describe free capacity", () => {
    expect(capacityLabel(capacityFor([], 300, 30))).toBe("5h available");
  });

  it("should describe remaining capacity", () => {
    expect(capacityLabel(capacityFor([task(120)], 300, 30))).toBe("2h planned · 3h left");
  });

  it("should describe an overbooked day", () => {
    expect(capacityLabel(capacityFor([task(240), task(120)], 300, 30))).toBe("1h over capacity");
  });
});

describe("CapacityMeter", () => {
  it("should expose the plan to assistive technology", () => {
    render(<CapacityMeter capacity={capacityFor([task(120)], 300, 30)} />);

    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "120");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuemax", "300");
    expect(screen.getByText("2h planned · 3h left")).toBeInTheDocument();
  });
});
