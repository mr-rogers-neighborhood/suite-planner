import type { LoroDoc } from "loro-crdt";

import { createId } from "../ids";
import { SCHEMA_VERSION, type WorkspaceMeta, workspaceMetaSchema } from "../schema";
import { ROOTS } from "./constants";
import { readRecord } from "./helpers";

export function initializeMeta(doc: LoroDoc, now: Date = new Date()): WorkspaceMeta {
  const map = doc.getMap(ROOTS.meta);
  if (map.get("workspaceId") === undefined) {
    map.set("workspaceId", createId("workspace"));
    map.set("schemaVersion", SCHEMA_VERSION);
    map.set("createdAt", now.toISOString());
  }
  return readMeta(doc);
}

export function readMeta(doc: LoroDoc): WorkspaceMeta {
  return readRecord(workspaceMetaSchema, doc.getMap(ROOTS.meta));
}
