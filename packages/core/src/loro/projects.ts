import type { LoroDoc } from "loro-crdt";

import { createId } from "../ids";
import { type Project, projectSchema } from "../schema";
import { ROOTS } from "./constants";
import { asMap, definedEntries, readRecord, writeFields } from "./helpers";

export function listProjects(doc: LoroDoc): Project[] {
  const projects: Project[] = [];
  for (const value of doc.getMap(ROOTS.projects).values()) {
    const map = asMap(value);
    if (map) projects.push(readRecord(projectSchema, map));
  }
  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

function getProject(doc: LoroDoc, id: string): Project | undefined {
  const map = asMap(doc.getMap(ROOTS.projects).get(id));
  return map ? readRecord(projectSchema, map) : undefined;
}

export function createProject(
  doc: LoroDoc,
  input: { name: string; color?: string | null },
  now: Date = new Date(),
): Project {
  const project = projectSchema.parse({
    id: createId("project"),
    name: input.name.trim(),
    color: input.color ?? null,
    createdAt: now.toISOString(),
  });
  const map = doc.getMap(ROOTS.projects).ensureMergeableMap(project.id);
  writeFields(map, project, Object.keys(project));
  doc.commit();
  return project;
}

export function updateProject(
  doc: LoroDoc,
  id: string,
  patch: Partial<Pick<Project, "name" | "color" | "archivedAt">>,
): Project {
  const current = getProject(doc, id);
  if (!current) throw new Error(`Project ${id} does not exist`);
  const next = projectSchema.parse({ ...current, ...patch });
  const map = asMap(doc.getMap(ROOTS.projects).get(id));
  if (!map) throw new Error(`Project ${id} is not a map`);
  const entries = definedEntries(patch);
  writeFields(
    map,
    next,
    entries.map(([key]) => key),
  );
  doc.commit();
  return next;
}

export function deleteProject(doc: LoroDoc, id: string): void {
  doc.getMap(ROOTS.projects).delete(id);
  doc.commit();
}
