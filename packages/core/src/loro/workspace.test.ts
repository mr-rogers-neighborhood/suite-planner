import { describe, expect, it } from "vitest";

import { WorkspaceDocument } from "./WorkspaceDocument";

const now = new Date("2026-01-05T09:00:00.000Z");

function createWorkspace(): WorkspaceDocument {
  return WorkspaceDocument.create({ now });
}

describe("WorkspaceDocument", () => {
  it("should create a task with an ordered day", () => {
    const workspace = createWorkspace();
    const first = workspace.createTask(
      { title: "Draft the plan", scheduledFor: "2026-01-05" },
      now,
    );
    const second = workspace.createTask({ title: "Review it", scheduledFor: "2026-01-05" }, now);

    expect(first.status).toBe("planned");
    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(workspace.tasksForDate("2026-01-05")).toHaveLength(2);
  });

  it("should write only the changed fields", () => {
    const workspace = createWorkspace();
    const task = workspace.createTask({ title: "Draft", scheduledFor: "2026-01-05" }, now);
    const updates: Uint8Array[] = [];
    workspace.observe((update) => updates.push(update));

    workspace.updateTask(task.id, { estimateMinutes: 45 }, now);

    expect(updates).toHaveLength(1);
    expect(workspace.getTask(task.id)?.estimateMinutes).toBe(45);
    expect(workspace.getTask(task.id)?.title).toBe("Draft");
  });

  it("should move a task between days and back to the inbox", () => {
    const workspace = createWorkspace();
    const task = workspace.createTask({ title: "Draft", scheduledFor: "2026-01-05" }, now);

    workspace.scheduleTask(task.id, "2026-01-06", now);
    expect(workspace.getTask(task.id)?.scheduledFor).toBe("2026-01-06");

    workspace.scheduleTask(task.id, null, now);
    expect(workspace.getTask(task.id)?.status).toBe("inbox");
    expect(workspace.getTask(task.id)?.scheduledFor).toBeNull();
  });

  it("should complete a task and restore it", () => {
    const workspace = createWorkspace();
    const task = workspace.createTask({ title: "Draft", scheduledFor: "2026-01-05" }, now);

    workspace.completeTask(task.id, null, now);
    expect(workspace.getTask(task.id)?.status).toBe("done");
    expect(workspace.getTask(task.id)?.completedAt).not.toBeNull();

    workspace.uncompleteTask(task.id, now);
    expect(workspace.getTask(task.id)?.status).toBe("planned");
    expect(workspace.getTask(task.id)?.completedAt).toBeNull();
  });

  it("should record a recurring occurrence without closing the task", () => {
    const workspace = createWorkspace();
    const task = workspace.createTask(
      {
        title: "Weekly review",
        scheduledFor: "2026-01-05",
        recurrence: { frequency: "weekly", interval: 1, weekdays: [1], until: null },
      },
      now,
    );

    workspace.completeTask(task.id, "2026-01-05", now);
    const updated = workspace.getTask(task.id);

    expect(updated?.status).toBe("planned");
    expect(updated?.recurrenceCompletions).toEqual(["2026-01-05"]);

    workspace.uncompleteOccurrence(task.id, "2026-01-05", now);
    expect(workspace.getTask(task.id)?.recurrenceCompletions).toEqual([]);
  });

  it("should keep notes in a text container", () => {
    const workspace = createWorkspace();
    const task = workspace.createTask({ title: "Draft" }, now);

    workspace.setNote(task.id, "First line");
    expect(workspace.getNote(task.id)).toBe("First line");

    workspace.setNote(task.id, "Second line");
    expect(workspace.getNote(task.id)).toBe("Second line");
  });

  it("should survive a snapshot round trip", () => {
    const workspace = createWorkspace();
    const task = workspace.createTask({ title: "Draft", estimateMinutes: 25 }, now);
    workspace.setNote(task.id, "A note");

    const restored = WorkspaceDocument.fromSnapshot(workspace.snapshot());

    expect(restored.getTask(task.id)?.title).toBe("Draft");
    expect(restored.getTask(task.id)?.estimateMinutes).toBe(25);
    expect(restored.getNote(task.id)).toBe("A note");
  });

  it("should merge concurrent edits on different fields", () => {
    const base = createWorkspace();
    const task = base.createTask({ title: "Draft", scheduledFor: "2026-01-05" }, now);
    const snapshot = base.snapshot();

    const left = WorkspaceDocument.fromSnapshot(snapshot);
    const right = WorkspaceDocument.fromSnapshot(snapshot);
    const leftUpdates: Uint8Array[] = [];
    const rightUpdates: Uint8Array[] = [];
    left.observe((update) => leftUpdates.push(update));
    right.observe((update) => rightUpdates.push(update));

    left.updateTask(task.id, { title: "Draft v2" }, now);
    right.updateTask(task.id, { estimateMinutes: 45 }, now);

    for (const update of leftUpdates) right.applyUpdate(update);
    for (const update of rightUpdates) left.applyUpdate(update);

    expect(left.getTask(task.id)?.title).toBe("Draft v2");
    expect(left.getTask(task.id)?.estimateMinutes).toBe(45);
    expect(right.getTask(task.id)?.title).toBe("Draft v2");
    expect(right.getTask(task.id)?.estimateMinutes).toBe(45);
  });

  it("should store day intent and shutdown notes", () => {
    const workspace = createWorkspace();
    workspace.updateDay("2026-01-05", { intention: "Ship the draft" });
    workspace.markDayShutdown("2026-01-05", now);

    const day = workspace.getDay("2026-01-05");
    expect(day?.intention).toBe("Ship the draft");
    expect(day?.shutdownAt).not.toBeNull();
  });

  it("should validate a loaded document", () => {
    const workspace = createWorkspace();
    workspace.createTask({ title: "Draft" }, now);
    expect(workspace.validate().isOk()).toBe(true);
  });
});
