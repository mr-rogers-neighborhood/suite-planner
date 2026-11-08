import { WorkspaceDocument } from "@suite/planner-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bootDocument } from "./snapshotStore";

/**
 * The bridge is the only machine surface the renderer has, and it belongs to whoever hosts the
 * renderer. These tests pin what a host is allowed to omit.
 */

const snapshot = () => WorkspaceDocument.create({ now: new Date(0) }).snapshot();

function stubBridge(overrides: Record<string, unknown> = {}) {
  return {
    loadSnapshot: async () => snapshot(),
    onWorkspaceReplaced: () => () => {},
    ...overrides,
  };
}

const bridge: { current: Record<string, unknown> } = { current: stubBridge() };

vi.mock("../platform/bridge", () => ({
  getBridge: () => bridge.current,
}));

afterEach(() => {
  bridge.current = stubBridge();
});

describe("bootDocument", () => {
  it("reports a first run when the host says it invented the workspace", async () => {
    bridge.current = stubBridge({ wasCreated: async () => true });
    const { created } = await bootDocument();
    expect(created).toBe(true);
  });

  it("reports an ordinary run when the host says a file was read", async () => {
    bridge.current = stubBridge({ wasCreated: async () => false });
    const { created } = await bootDocument();
    expect(created).toBe(false);
  });

  it("boots when the host has no notion of a first run", async () => {
    // A container hands over a document. It has nothing to report, and it must not have to
    // invent an answer just to make the renderer start.
    const { created, replica } = await bootDocument();
    expect(created).toBe(false);
    expect(replica.getSnapshot()).toBeDefined();
  });
});
