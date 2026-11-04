export const ROOTS = {
  tasks: "tasks",
  projects: "projects",
  tags: "tags",
  events: "events",
  days: "days",
  focusSessions: "focusSessions",
  settings: "settings",
  meta: "meta",
} as const;

const NOTE_PREFIX = "note:";

export function noteKey(taskId: string): string {
  return `${NOTE_PREFIX}${taskId}`;
}
