import type { DocumentRecord, ModuleHost } from "@suite/go";
import { WorkspaceDocument } from "@suite/planner-core";
import { describe, expect, it } from "vitest";
import { createPlannerHost } from "./plannerHost";

/**
 * The adapter is the thing that decides whether a document survives leaving the module.
 *
 * These tests run against an in-memory `ModuleHost` shaped exactly like `suite-go`'s — bytes in,
 * bytes out, no parsing — because the failure they exist to prevent is a *contract* failure, not a
 * persistence bug: a host that can hand back something the app cannot open.
 */

interface FakeHost extends ModuleHost {
  readonly saved: Map<string, Uint8Array>;
  readonly writes: number;
}

function fakeHost(seed: ReadonlyMap<string, Uint8Array> = new Map()): FakeHost {
  const files = new Map<string, Uint8Array>(seed);
  const titles = new Map<string, string>();
  const kv = new Map<string, string>();
  let counter = 0;
  let writes = 0;

  const summaryOf = (id: string) => ({
    id,
    moduleId: "planner" as const,
    name: "Planner.planner",
    title: titles.get(id) ?? "Untitled",
    savedAt: 0,
  });

  return {
    moduleId: "planner",
    saved: files,
    get writes() {
      return writes;
    },
    documents: {
      async list() {
        return [...files.keys()].map(summaryOf);
      },
      async create() {
        counter += 1;
        const id = `doc-${counter}`;
        // `suite-go` creates an empty record on purpose: the app writes the schema.
        files.set(id, new Uint8Array(0));
        return { ...summaryOf(id), bytes: new Uint8Array(0) } satisfies DocumentRecord;
      },
      async open(id: string) {
        const bytes = files.get(id);
        return bytes === undefined ? null : { ...summaryOf(id), bytes };
      },
      async save(id: string, input: { readonly bytes: Uint8Array; readonly title?: string }) {
        writes += 1;
        files.set(id, input.bytes);
        if (input.title !== undefined) titles.set(id, input.title);
        return summaryOf(id);
      },
      async remove(id: string) {
        files.delete(id);
      },
    },
    storage: {
      async get(key: string) {
        return kv.get(key) ?? null;
      },
      async set(key: string, value: string) {
        kv.set(key, value);
      },
      async delete(key: string) {
        kv.delete(key);
      },
      async keys() {
        return [...kv.keys()];
      },
    },
    navigation: { setTitle() {}, close() {} },
    recents: { remember() {}, forget() {} },
    files: {
      async pickOpen() {
        return null;
      },
      async write() {
        return { ok: true as const, uri: "file:///dev/null" };
      },
      async share() {
        return { ok: false as const, reason: "cancelled" as const };
      },
    },
    theme: { scheme: "light" as const, density: "cozy" as const, cssVariables: {} },
  } as unknown as FakeHost;
}

describe("the pack's Planner bridge", () => {
  it("answers null on a first run, so the app makes its own document", async () => {
    const host = fakeHost();
    const bridge = createPlannerHost(host);

    expect(await bridge.loadSnapshot()).toBeNull();
    // A record exists, empty, because the host needs somewhere to put what the app writes next.
    expect(host.saved.size).toBe(1);
    expect([...host.saved.values()][0]?.byteLength).toBe(0);
  });

  it("keeps the document the app hands over, and can reopen it", async () => {
    // The measured failure this guards: `commit(update)` carries only what happens *after*
    // creation, so a document rebuilt from updates alone has no schema.
    const host = fakeHost();
    const bridge = createPlannerHost(host);
    await bridge.loadSnapshot();

    const app = WorkspaceDocument.create({ now: new Date(0) });
    await bridge.adopt?.(app.snapshot());

    expect(host.writes).toBe(1);
    const [stored] = [...host.saved.values()];
    expect(stored?.byteLength).toBeGreaterThan(0);
    // The second launch is where a schema-less file would throw instead of opening.
    const reopened = WorkspaceDocument.fromSnapshot(stored as Uint8Array);
    expect(reopened.getSnapshot().meta).toBeDefined();
  });

  it("resumes the same document on a second run", async () => {
    const host = fakeHost();
    const first = createPlannerHost(host);
    await first.loadSnapshot();
    await first.adopt?.(WorkspaceDocument.create({ now: new Date(0) }).snapshot());

    const second = createPlannerHost(host);
    const bytes = await second.loadSnapshot();
    expect(bytes).not.toBeNull();
    expect(() => WorkspaceDocument.fromSnapshot(bytes as Uint8Array)).not.toThrow();
  });

  it("writes on the boundary, not on every update", async () => {
    const host = fakeHost();
    const bridge = createPlannerHost(host);
    await bridge.loadSnapshot();
    const app = WorkspaceDocument.create({ now: new Date(0) });
    await bridge.adopt?.(app.snapshot());
    const afterAdopt = host.writes;

    // Two edits arrive as updates, as the renderer's subscription sends them. The escape hatch is
    // used on purpose: this test is about *when* a write happens, not about the task schema.
    const updates: Uint8Array[] = [];
    app.observe((update) => updates.push(update));
    app.loro.getMap("probe").set("first", "one");
    app.loro.commit();
    app.loro.getMap("probe").set("second", "two");
    app.loro.commit();
    expect(updates.length).toBeGreaterThan(0);

    for (const update of updates) await bridge.commit(update);
    // Nothing yet: ADR-0005 refuses a write per keystroke.
    expect(host.writes).toBe(afterAdopt);

    await bridge.flush();
    expect(host.writes).toBe(afterAdopt + 1);
    bridge.dispose();
  });

  it("does not write when there is nothing new to write", async () => {
    const host = fakeHost();
    const bridge = createPlannerHost(host);
    await bridge.loadSnapshot();

    await bridge.flush();
    expect(host.writes).toBe(0);
    bridge.dispose();
  });

  it("does not open a document it cannot read", async () => {
    // The frame bridge used to ignore the module filter, so `list()` handed back another domain's
    // file and the first `fromSnapshot` threw a decode error. A host that lists something
    // unreadable must not stop the app from booting.
    const host = fakeHost(new Map([["foreign", new TextEncoder().encode("line 1\nline 2\n")]]));
    const bridge = createPlannerHost(host);

    expect(await bridge.loadSnapshot()).toBeNull();
    // Its own empty document, not the foreign one.
    expect(host.saved.size).toBe(2);
    const bytes = [...host.saved.values()];
    expect(bytes.some((value) => value.byteLength === 0)).toBe(true);
  });

  it("says plainly that export and import are not wired", async () => {
    // A pack that silently does nothing on Export looks broken. A cancelled dialog does not.
    const host = fakeHost();
    const bridge = createPlannerHost(host);
    expect(await bridge.exportWorkspace()).toEqual({ canceled: true });
    expect(await bridge.importWorkspace()).toEqual({ canceled: true });
    expect(await bridge.platform()).toBe("suite-go");
    bridge.dispose();
  });
});
