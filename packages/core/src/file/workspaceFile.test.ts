import { describe, expect, it } from "vitest";

import { WorkspaceDocument } from "../loro/WorkspaceDocument";
import { decodeWorkspaceFile, encodeWorkspaceFile, WORKSPACE_FILE_FORMAT } from "./workspaceFile";

const now = new Date("2026-01-05T09:00:00.000Z");

describe("workspace file", () => {
  it("should round trip a workspace", () => {
    const workspace = WorkspaceDocument.create({ now });
    const task = workspace.createTask({ title: "Draft", estimateMinutes: 30 }, now);

    const encoded = encodeWorkspaceFile(workspace, now);
    const decoded = decodeWorkspaceFile(encoded);

    expect(decoded.isOk()).toBe(true);
    if (decoded.isErr()) return;

    const restored = WorkspaceDocument.fromSnapshot(decoded.value);
    expect(restored.getTask(task.id)?.title).toBe("Draft");
  });

  it("should write a readable envelope", () => {
    const workspace = WorkspaceDocument.create({ now });
    const envelope = JSON.parse(encodeWorkspaceFile(workspace, now)) as Record<string, unknown>;

    expect(envelope.format).toBe(WORKSPACE_FILE_FORMAT);
    expect(envelope.formatVersion).toBe(1);
    expect(typeof envelope.snapshot).toBe("string");
  });

  it("should reject a file that is not JSON", () => {
    const decoded = decodeWorkspaceFile("not json");
    expect(decoded.isErr()).toBe(true);
    if (decoded.isErr()) expect(decoded.error.code).toBe("not-json");
  });

  it("should reject a JSON file from another app", () => {
    const decoded = decodeWorkspaceFile(JSON.stringify({ hello: "world" }));
    expect(decoded.isErr()).toBe(true);
    if (decoded.isErr()) expect(decoded.error.code).toBe("wrong-format");
  });

  it("should reject a newer file version", () => {
    const decoded = decodeWorkspaceFile(
      JSON.stringify({
        format: WORKSPACE_FILE_FORMAT,
        formatVersion: 99,
        schemaVersion: 1,
        exportedAt: now.toISOString(),
        snapshot: "",
      }),
    );
    expect(decoded.isErr()).toBe(true);
    if (decoded.isErr()) expect(decoded.error.code).toBe("unsupported-version");
  });
});
