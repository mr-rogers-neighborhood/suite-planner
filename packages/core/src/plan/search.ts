import fuzzysort from "fuzzysort";

import type { Project, Tag, Task } from "../schema";

export function searchTasks(
  tasks: readonly Task[],
  query: string,
  options: { projects?: readonly Project[]; tags?: readonly Tag[]; limit?: number } = {},
): Task[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const projectNames = new Map(
    (options.projects ?? []).map((project) => [project.id, project.name]),
  );
  const tagNames = new Map((options.tags ?? []).map((tag) => [tag.id, tag.name]));

  const items = tasks.map((task) => ({
    task,
    haystack: [
      task.title,
      task.projectId ? (projectNames.get(task.projectId) ?? "") : "",
      ...task.tagIds.map((id) => tagNames.get(id) ?? ""),
    ]
      .filter(Boolean)
      .join(" "),
  }));

  return fuzzysort
    .go(trimmed, items, { key: "haystack", limit: options.limit ?? 25 })
    .map((result) => result.obj.task);
}
