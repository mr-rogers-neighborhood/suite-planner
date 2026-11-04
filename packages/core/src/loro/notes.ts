import type { LoroDoc, LoroText } from "loro-crdt";

import { noteKey } from "./constants";

export function getNote(doc: LoroDoc, taskId: string): string {
  return doc.getText(noteKey(taskId)).toString();
}

export function setNote(doc: LoroDoc, taskId: string, value: string): string {
  const text = doc.getText(noteKey(taskId));
  replaceText(text, value);
  doc.commit();
  return value;
}

export function getNoteText(doc: LoroDoc, taskId: string): LoroText {
  return doc.getText(noteKey(taskId));
}

function replaceText(text: LoroText, value: string): void {
  const current = text.toString();
  if (current === value) return;
  if (current.length > 0) text.delete(0, current.length);
  if (value.length > 0) text.insert(0, value);
}
