import { err, ok, type Result } from "neverthrow";

import type { WorkspaceDocument } from "../loro/WorkspaceDocument";
import { SCHEMA_VERSION } from "../schema";

export const WORKSPACE_FILE_FORMAT = "suite.planner";
export const WORKSPACE_FILE_VERSION = 1;

export type WorkspaceFileEnvelope = {
  format: typeof WORKSPACE_FILE_FORMAT;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  snapshot: string;
};

export type WorkspaceFileErrorCode =
  | "not-json"
  | "wrong-format"
  | "unsupported-version"
  | "bad-snapshot";

export class WorkspaceFileError extends Error {
  constructor(
    readonly code: WorkspaceFileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceFileError";
  }
}

export function encodeWorkspaceFile(doc: WorkspaceDocument, now: Date = new Date()): string {
  const envelope: WorkspaceFileEnvelope = {
    format: WORKSPACE_FILE_FORMAT,
    formatVersion: WORKSPACE_FILE_VERSION,
    schemaVersion: doc.getMeta().schemaVersion || SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    snapshot: toBase64(doc.snapshot()),
  };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export function decodeWorkspaceFile(raw: string): Result<Uint8Array, WorkspaceFileError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err(new WorkspaceFileError("not-json", "The file is not valid JSON"));
  }

  if (!isEnvelope(parsed)) {
    return err(
      new WorkspaceFileError("wrong-format", "The file is not a Suite Planner workspace export"),
    );
  }

  if (parsed.formatVersion > WORKSPACE_FILE_VERSION) {
    return err(
      new WorkspaceFileError(
        "unsupported-version",
        `File version ${parsed.formatVersion} is newer than this build understands`,
      ),
    );
  }

  try {
    return ok(fromBase64(parsed.snapshot));
  } catch {
    return err(
      new WorkspaceFileError("bad-snapshot", "The workspace snapshot could not be decoded"),
    );
  }
}

function isEnvelope(value: unknown): value is WorkspaceFileEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.format === WORKSPACE_FILE_FORMAT &&
    typeof record.formatVersion === "number" &&
    typeof record.schemaVersion === "number" &&
    typeof record.exportedAt === "string" &&
    typeof record.snapshot === "string"
  );
}

function toBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
