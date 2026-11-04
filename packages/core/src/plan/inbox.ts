import type { Task } from "../schema";

export function inboxTasks(tasks: readonly Task[]): Task[] {
  return tasks
    .filter((task) => task.scheduledFor === null && task.status === "inbox")
    .sort((a, b) => {
      const priority = (a.priority ?? 9) - (b.priority ?? 9);
      if (priority !== 0) return priority;
      return b.createdAt.localeCompare(a.createdAt);
    });
}
