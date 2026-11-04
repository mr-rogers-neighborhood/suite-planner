import type { ReminderEvent } from "@suite/planner-core";
import { powerMonitor } from "electron";

import type { WorkspaceStore } from "./workspaceStore";

const TICK_MS = 30_000;

/**
 * Reminders fire from the main process, so they still fire when the window is hidden in the tray.
 * `remindedAt` is written back as a leaf field, which is what keeps a reminder from repeating.
 */
export class ReminderScheduler {
  readonly #store: WorkspaceStore;
  readonly #notify: (reminder: ReminderEvent) => void;
  #timer: NodeJS.Timeout | null = null;
  #resumeListener: (() => void) | null = null;

  constructor(store: WorkspaceStore, notify: (reminder: ReminderEvent) => void) {
    this.#store = store;
    this.#notify = notify;
  }

  start(): void {
    this.tick();
    this.#timer = setInterval(() => this.tick(), TICK_MS);
    this.#resumeListener = () => this.tick();
    powerMonitor.on("resume", this.#resumeListener);
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
    if (this.#resumeListener) powerMonitor.off("resume", this.#resumeListener);
    this.#resumeListener = null;
  }

  tick(now: Date = new Date()): void {
    const due = this.#store.document.listTasks().filter((task) => {
      if (!task.remindAt || task.remindedAt || task.status === "done") return false;
      return Date.parse(task.remindAt) <= now.getTime();
    });

    for (const task of due) {
      const remindAt = task.remindAt;
      if (!remindAt) continue;
      this.#store.mutate((doc) => doc.updateTask(task.id, { remindedAt: now.toISOString() }, now));
      this.#notify({ taskId: task.id, title: task.title, remindAt });
    }
  }
}
