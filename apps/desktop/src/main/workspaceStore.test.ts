import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { WorkspaceDocument } from "@gradient/core";
import { afterEach, describe, expect, it } from "vitest";

import type { WorkspacePaths } from "./paths";
import { WorkspaceStore } from "./workspaceStore";

const cleanups: string[] = [];

async function paths(): Promise<WorkspacePaths> {
  const dir = await mkdtemp(join(tmpdir(), "gradient-store-"));
  cleanups.push(dir);
  return {
    dir,
    workspace: join(dir, "workspace.gradient"),
    backup: join(dir, "workspace.backup.gradient"),
    temp: join(dir, "workspace.gradient.tmp"),
  };
}

/** Sends the same delta the renderer sends after a local edit. */
function commitTask(store: WorkspaceStore, title: string): string {
  const replica = WorkspaceDocument.fromSnapshot(store.snapshot());
  const updates: Uint8Array[] = [];
  replica.observe((update) => updates.push(update));
  const task = replica.createTask({ title });
  for (const update of updates) store.commit(update);
  return task.id;
}

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("WorkspaceStore", () => {
  it("should write a committed update and restore it", async () => {
    const location = await paths();
    const store = await WorkspaceStore.open(location);
    const id = commitTask(store, "Persisted task");
    await store.flush();

    const reopened = await WorkspaceStore.open(location);
    expect(reopened.document.getTask(id)?.title).toBe("Persisted task");
  });

  it("should export and import into a fresh workspace", async () => {
    const source = await paths();
    const store = await WorkspaceStore.open(source);
    const id = commitTask(store, "Exported task");
    await store.flush();

    const file = join(source.dir, "export.gradient");
    await store.exportTo(file);

    const target = await paths();
    const fresh = await WorkspaceStore.open(target);
    expect(fresh.document.listTasks()).toHaveLength(0);

    await fresh.importFrom(file);
    expect(fresh.document.getTask(id)?.title).toBe("Exported task");

    const reopened = await WorkspaceStore.open(target);
    expect(reopened.document.getTask(id)?.title).toBe("Exported task");
  });

  it("should fall back to the backup when the workspace is corrupt", async () => {
    const location = await paths();
    const store = await WorkspaceStore.open(location);
    const first = commitTask(store, "First task");
    await store.flush();
    commitTask(store, "Second task");
    await store.flush();

    await writeFile(location.workspace, "not a workspace", "utf8");

    const recovered = await WorkspaceStore.open(location);
    expect(recovered.document.getTask(first)?.title).toBe("First task");
  });

  it("should reject an import that is not a workspace file", async () => {
    const location = await paths();
    const store = await WorkspaceStore.open(location);
    const file = join(location.dir, "broken.gradient");
    await writeFile(file, JSON.stringify({ hello: "world" }), "utf8");

    await expect(store.importFrom(file)).rejects.toMatchObject({ code: "wrong-format" });
    expect(await readFile(location.workspace, "utf8").catch(() => "")).not.toContain("hello");
  });
});
