import type { WorkspaceDocument } from "@gradient/core";

export function resolveProjectId(doc: WorkspaceDocument, name: string): string {
  const normalized = name.trim();
  const existing = doc
    .listProjects()
    .find((project) => project.name.toLowerCase() === normalized.toLowerCase());
  return existing?.id ?? doc.createProject({ name: normalized }).id;
}

export function resolveTagIds(doc: WorkspaceDocument, names: readonly string[]): string[] {
  return names.map((name) => {
    const normalized = name.trim();
    const existing = doc
      .listTags()
      .find((tag) => tag.name.toLowerCase() === normalized.toLowerCase());
    return existing?.id ?? doc.createTag({ name: normalized }).id;
  });
}
