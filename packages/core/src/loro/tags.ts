import type { LoroDoc } from "loro-crdt";

import { createId } from "../ids";
import { type Tag, tagSchema } from "../schema";
import { ROOTS } from "./constants";
import { asMap, definedEntries, readRecord, writeFields } from "./helpers";

export function listTags(doc: LoroDoc): Tag[] {
  const tags: Tag[] = [];
  for (const value of doc.getMap(ROOTS.tags).values()) {
    const map = asMap(value);
    if (map) tags.push(readRecord(tagSchema, map));
  }
  return tags.sort((a, b) => a.name.localeCompare(b.name));
}

function getTag(doc: LoroDoc, id: string): Tag | undefined {
  const map = asMap(doc.getMap(ROOTS.tags).get(id));
  return map ? readRecord(tagSchema, map) : undefined;
}

export function createTag(
  doc: LoroDoc,
  input: { name: string; color?: string | null },
  now: Date = new Date(),
): Tag {
  const tag = tagSchema.parse({
    id: createId("tag"),
    name: input.name.trim(),
    color: input.color ?? null,
    createdAt: now.toISOString(),
  });
  const map = doc.getMap(ROOTS.tags).ensureMergeableMap(tag.id);
  writeFields(map, tag, Object.keys(tag));
  doc.commit();
  return tag;
}

export function updateTag(
  doc: LoroDoc,
  id: string,
  patch: Partial<Pick<Tag, "name" | "color">>,
): Tag {
  const current = getTag(doc, id);
  if (!current) throw new Error(`Tag ${id} does not exist`);
  const next = tagSchema.parse({ ...current, ...patch });
  const map = asMap(doc.getMap(ROOTS.tags).get(id));
  if (!map) throw new Error(`Tag ${id} is not a map`);
  const entries = definedEntries(patch);
  writeFields(
    map,
    next,
    entries.map(([key]) => key),
  );
  doc.commit();
  return next;
}

export function deleteTag(doc: LoroDoc, id: string): void {
  doc.getMap(ROOTS.tags).delete(id);
  doc.commit();
}
