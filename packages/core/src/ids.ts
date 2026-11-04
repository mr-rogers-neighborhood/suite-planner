export type IdPrefix = "task" | "project" | "tag" | "event" | "focus" | "check" | "workspace";

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

export function isId(value: string, prefix: IdPrefix): boolean {
  return value.startsWith(`${prefix}_`) && value.length > prefix.length + 1;
}
