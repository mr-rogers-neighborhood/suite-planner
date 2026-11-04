import type { LoroDoc } from "loro-crdt";

import type { DateKey } from "../dates";
import { createId } from "../ids";
import { type CalendarEvent, calendarEventSchema } from "../schema";
import { ROOTS } from "./constants";
import { asMap, definedEntries, readRecord, writeFields } from "./helpers";

export function listEvents(doc: LoroDoc, dateKey?: DateKey): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const value of doc.getMap(ROOTS.events).values()) {
    const map = asMap(value);
    if (!map) continue;
    const event = readRecord(calendarEventSchema, map);
    if (!dateKey || event.dateKey === dateKey) events.push(event);
  }
  return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getEvent(doc: LoroDoc, id: string): CalendarEvent | undefined {
  const map = asMap(doc.getMap(ROOTS.events).get(id));
  return map ? readRecord(calendarEventSchema, map) : undefined;
}

export type CalendarEventInput = Omit<
  CalendarEvent,
  "id" | "createdAt" | "updatedAt" | "notes" | "color"
> &
  Partial<Pick<CalendarEvent, "notes" | "color">>;

export function createEvent(
  doc: LoroDoc,
  input: CalendarEventInput,
  now: Date = new Date(),
): CalendarEvent {
  const timestamp = now.toISOString();
  const event = calendarEventSchema.parse({
    ...input,
    id: createId("event"),
    notes: input.notes ?? "",
    color: input.color ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const map = doc.getMap(ROOTS.events).ensureMergeableMap(event.id);
  writeFields(map, event, Object.keys(event));
  doc.commit();
  return event;
}

export function updateEvent(
  doc: LoroDoc,
  id: string,
  patch: Partial<Omit<CalendarEvent, "id" | "createdAt">>,
  now: Date = new Date(),
): CalendarEvent {
  const current = getEvent(doc, id);
  if (!current) throw new Error(`Event ${id} does not exist`);
  const changes = Object.fromEntries(definedEntries(patch)) as Partial<CalendarEvent>;
  const next = calendarEventSchema.parse({
    ...current,
    ...changes,
    updatedAt: now.toISOString(),
  });
  const map = asMap(doc.getMap(ROOTS.events).get(id));
  if (!map) throw new Error(`Event ${id} is not a map`);
  writeFields(map, next, [...Object.keys(changes), "updatedAt"]);
  doc.commit();
  return next;
}

export function deleteEvent(doc: LoroDoc, id: string): void {
  doc.getMap(ROOTS.events).delete(id);
  doc.commit();
}
