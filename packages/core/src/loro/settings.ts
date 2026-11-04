import type { LoroDoc } from "loro-crdt";

import { type Settings, settingsSchema } from "../schema";
import { ROOTS } from "./constants";
import { readRecord, writeFields } from "./helpers";

export function ensureSettings(doc: LoroDoc): Settings {
  const map = doc.getMap(ROOTS.settings);
  if (map.size === 0) {
    const defaults = settingsSchema.parse({});
    writeFields(map, defaults, Object.keys(defaults));
  }
  return readSettings(doc);
}

export function readSettings(doc: LoroDoc): Settings {
  return readRecord(settingsSchema, doc.getMap(ROOTS.settings));
}

export function updateSettings(doc: LoroDoc, patch: Partial<Settings>): Settings {
  const current = readSettings(doc);
  const next = settingsSchema.parse({ ...current, ...patch });
  const map = doc.getMap(ROOTS.settings);
  writeFields(map, next, Object.keys(patch));
  doc.commit();
  return next;
}
