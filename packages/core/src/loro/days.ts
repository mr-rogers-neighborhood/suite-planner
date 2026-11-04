import type { LoroDoc } from "loro-crdt";

import type { DateKey } from "../dates";
import { type DayRecord, dayRecordSchema } from "../schema";
import { ROOTS } from "./constants";
import { asMap, definedEntries, readRecord, writeFields } from "./helpers";

export function listDays(doc: LoroDoc): DayRecord[] {
  const days: DayRecord[] = [];
  for (const value of doc.getMap(ROOTS.days).values()) {
    const map = asMap(value);
    if (map) days.push(readRecord(dayRecordSchema, map));
  }
  return days.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function getDay(doc: LoroDoc, dateKey: DateKey): DayRecord | undefined {
  const map = asMap(doc.getMap(ROOTS.days).get(dateKey));
  return map ? readRecord(dayRecordSchema, map) : undefined;
}

export function ensureDay(doc: LoroDoc, dateKey: DateKey): DayRecord {
  const existing = getDay(doc, dateKey);
  if (existing) return existing;
  const record = dayRecordSchema.parse({ dateKey });
  const map = doc.getMap(ROOTS.days).ensureMergeableMap(dateKey);
  writeFields(map, record, Object.keys(record));
  doc.commit();
  return record;
}

export type DayRecordPatch = Partial<Omit<DayRecord, "dateKey">>;

export function updateDay(doc: LoroDoc, dateKey: DateKey, patch: DayRecordPatch): DayRecord {
  const current = ensureDay(doc, dateKey);
  const changes = Object.fromEntries(definedEntries(patch)) as Partial<DayRecord>;
  const next = dayRecordSchema.parse({ ...current, ...changes });
  const map = asMap(doc.getMap(ROOTS.days).get(dateKey));
  if (!map) throw new Error(`Day ${dateKey} is not a map`);
  writeFields(map, next, Object.keys(changes));
  doc.commit();
  return next;
}

export function markDayPlanned(doc: LoroDoc, dateKey: DateKey, now: Date = new Date()): DayRecord {
  return updateDay(doc, dateKey, { plannedAt: now.toISOString() });
}

export function markDayShutdown(doc: LoroDoc, dateKey: DateKey, now: Date = new Date()): DayRecord {
  return updateDay(doc, dateKey, { shutdownAt: now.toISOString() });
}
