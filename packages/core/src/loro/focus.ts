import type { LoroDoc } from "loro-crdt";

import { createId } from "../ids";
import { type FocusSession, focusSessionSchema } from "../schema";
import { ROOTS } from "./constants";
import { asMap, definedEntries, readRecord, writeFields } from "./helpers";

export function listFocusSessions(doc: LoroDoc): FocusSession[] {
  const sessions: FocusSession[] = [];
  for (const value of doc.getMap(ROOTS.focusSessions).values()) {
    const map = asMap(value);
    if (map) sessions.push(readRecord(focusSessionSchema, map));
  }
  return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function startFocusSession(
  doc: LoroDoc,
  input: { taskId: string | null; plannedMinutes: number },
  now: Date = new Date(),
): FocusSession {
  const session = focusSessionSchema.parse({
    id: createId("focus"),
    taskId: input.taskId,
    plannedMinutes: input.plannedMinutes,
    startedAt: now.toISOString(),
  });
  const map = doc.getMap(ROOTS.focusSessions).ensureMergeableMap(session.id);
  writeFields(map, session, Object.keys(session));
  doc.commit();
  return session;
}

export function endFocusSession(doc: LoroDoc, id: string, now: Date = new Date()): FocusSession {
  const map = asMap(doc.getMap(ROOTS.focusSessions).get(id));
  if (!map) throw new Error(`Focus session ${id} does not exist`);
  const current = readRecord(focusSessionSchema, map);
  const next = focusSessionSchema.parse({ ...current, endedAt: now.toISOString() });
  writeFields(map, next, ["endedAt"]);
  doc.commit();
  return next;
}

export function activeFocusSession(doc: LoroDoc): FocusSession | undefined {
  return listFocusSessions(doc).find((session) => session.endedAt === null);
}

export function updateFocusSession(
  doc: LoroDoc,
  id: string,
  patch: Partial<Pick<FocusSession, "taskId" | "plannedMinutes" | "endedAt">>,
): FocusSession {
  const map = asMap(doc.getMap(ROOTS.focusSessions).get(id));
  if (!map) throw new Error(`Focus session ${id} does not exist`);
  const current = readRecord(focusSessionSchema, map);
  const changes = Object.fromEntries(definedEntries(patch)) as Partial<FocusSession>;
  const next = focusSessionSchema.parse({ ...current, ...changes });
  writeFields(map, next, Object.keys(changes));
  doc.commit();
  return next;
}
