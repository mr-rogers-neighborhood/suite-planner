import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { adoptLegacyWorkspace, workspacePathsFrom } from "./workspaceLocation";

const cleanups: string[] = [];

async function folder(prefix: string): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), prefix));
  cleanups.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("workspacePathsFrom", () => {
  it("should put the default workspace in the documents folder", async () => {
    const documents = await folder("suite-planner-documents-");
    const paths = workspacePathsFrom(documents);

    expect(paths.workspace).toBe(join(documents, "workspace.planner"));
    expect(paths.backup).toBe(join(documents, "workspace.backup.planner"));
    expect(paths.temp).toBe(join(documents, "workspace.planner.tmp"));
  });

  it("should keep the backup and temporary file beside a named file", async () => {
    const paths = workspacePathsFrom("/documents/Suite/Planner", "/elsewhere/Field notes.planner");

    expect(paths.dir).toBe("/elsewhere");
    expect(paths.workspace).toBe("/elsewhere/Field notes.planner");
    expect(paths.backup).toBe("/elsewhere/Field notes.backup.planner");
    expect(paths.temp).toBe("/elsewhere/Field notes.planner.tmp");
  });

  it("should ignore a blank file rather than opening the documents folder", async () => {
    const paths = workspacePathsFrom("/documents/Suite/Planner", "   ");
    expect(paths.workspace).toBe(join("/documents/Suite/Planner", "workspace.planner"));
  });
});

describe("adoptLegacyWorkspace", () => {
  it("should copy the workspace and its backup into the documents folder", async () => {
    const legacy = await folder("suite-planner-legacy-");
    const documents = await folder("suite-planner-documents-");
    await writeFile(join(legacy, "workspace.planner"), "current", "utf8");
    await writeFile(join(legacy, "workspace.backup.planner"), "previous", "utf8");

    const destination = workspacePathsFrom(documents);
    const copied = await adoptLegacyWorkspace(destination, legacy);

    expect(copied).toEqual([destination.workspace, destination.backup]);
    expect(await readFile(destination.workspace, "utf8")).toBe("current");
    expect(await readFile(destination.backup, "utf8")).toBe("previous");
    // The original stays: a migration that deletes the only copy is how work disappears.
    expect(await readFile(join(legacy, "workspace.planner"), "utf8")).toBe("current");
  });

  it("should do nothing when a workspace is already in the documents folder", async () => {
    const legacy = await folder("suite-planner-legacy-");
    const documents = await folder("suite-planner-documents-");
    await writeFile(join(legacy, "workspace.planner"), "old", "utf8");
    await writeFile(join(documents, "workspace.planner"), "new", "utf8");

    const destination = workspacePathsFrom(documents);
    expect(await adoptLegacyWorkspace(destination, legacy)).toEqual([]);
    expect(await readFile(destination.workspace, "utf8")).toBe("new");
  });

  it("should do nothing when there is no legacy workspace", async () => {
    const legacy = await folder("suite-planner-legacy-");
    const documents = await folder("suite-planner-documents-");
    expect(await adoptLegacyWorkspace(workspacePathsFrom(documents), legacy)).toEqual([]);
  });

  it("should do nothing when the destination is the legacy folder", async () => {
    const legacy = await folder("suite-planner-legacy-");
    await writeFile(join(legacy, "workspace.planner"), "current", "utf8");
    await mkdir(join(legacy, "nested"), { recursive: true });

    const destination = workspacePathsFrom(legacy);
    expect(await adoptLegacyWorkspace(destination, legacy)).toEqual([]);
  });
});
