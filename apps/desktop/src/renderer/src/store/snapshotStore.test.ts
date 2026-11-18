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

  it("makes its own document when the host has none to hand over", async () => {
    // `fromSnapshot` needs a schema-initialised snapshot, which a container cannot manufacture.
    // So `null` means the app creates the document — not that booting failed.
    bridge.current = stubBridge({ loadSnapshot: async () => null });
    const { replica } = await bootDocument();
    expect(replica.getSnapshot()).toBeDefined();
    expect(replica.getSnapshot().days).toBeDefined();
  });

  it("hands the document it made back to a host that had none", async () => {
    // The host cannot make a schema, and `commit(update)` only carries what happens *after*
    // creation. So the first document travels once, and it has to be a real snapshot.
    const adopted: Uint8Array[] = [];
    bridge.current = stubBridge({
      loadSnapshot: async () => null,
      adopt: async (snapshot: Uint8Array) => {
        adopted.push(snapshot);
      },
    });

    await bootDocument();

    expect(adopted).toHaveLength(1);
    const snapshot = adopted[0] as Uint8Array;
    expect(snapshot.byteLength).toBeGreaterThan(0);
    // It has to be something the app itself can reopen, or the second launch throws.
    const reopened = WorkspaceDocument.fromSnapshot(snapshot);
    expect(reopened.getSnapshot().meta).toBeDefined();
  });

  it("does not adopt when the host already had a document", async () => {
    const adopted: Uint8Array[] = [];
    bridge.current = stubBridge({
      adopt: async (snapshot: Uint8Array) => {
        adopted.push(snapshot);
      },
    });

    await bootDocument();

    expect(adopted).toEqual([]);
  });
});
