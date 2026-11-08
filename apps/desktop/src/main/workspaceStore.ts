import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";

import { decodeWorkspaceFile, encodeWorkspaceFile, WorkspaceDocument } from "@suite/planner-core";

import type { WorkspacePaths } from "./paths";

/**
 * Owns the authoritative document in the main process. Renderer edits arrive as CRDT updates and
 * are written to disk on a debounce; the file write is atomic and keeps one previous copy.
 */
export class WorkspaceStore {
  #doc: WorkspaceDocument;
  readonly #paths: WorkspacePaths;
  /**
   * True when this session started from nothing.
   *
   * The first-run case is the only one where a person has not yet said which workspace they
   * are in, so it is the only one that gets a start screen. Any other run means a file was
   * already there and they expect to land in it.
   */
  readonly #created: boolean;
  #saveTimer: NodeJS.Timeout | null = null;
  #flushing: Promise<void> = Promise.resolve();

  private constructor(doc: WorkspaceDocument, paths: WorkspacePaths, created: boolean) {
    this.#doc = doc;
    this.#paths = paths;
    this.#created = created;
  }

  static async open(paths: WorkspacePaths): Promise<WorkspaceStore> {
    await mkdir(paths.dir, { recursive: true });
    const { doc, created } = await loadOrCreate(paths);
    return new WorkspaceStore(doc, paths, created);
  }

  /** Whether this session began with no workspace file at all. */
  get created(): boolean {
    return this.#created;
  }

  get document(): WorkspaceDocument {
    return this.#doc;
  }

  get path(): string {
    return this.#paths.workspace;
  }

  snapshot(): Uint8Array {
    return this.#doc.snapshot();
  }

  commit(update: Uint8Array): void {
    this.#doc.applyUpdate(update);
    this.scheduleSave();
  }

  /** Runs a main-process mutation and schedules the write that follows it. */
  mutate<T>(mutation: (doc: WorkspaceDocument) => T): T {
    const result = mutation(this.#doc);
    this.scheduleSave();
    return result;
  }

  scheduleSave(): void {
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.#saveTimer = null;
      void this.flush();
    }, 400);
  }

  flush(): Promise<void> {
    if (this.#saveTimer) {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = null;
    }
    this.#flushing = this.#flushing
      .then(() => this.writeCurrent())
      .catch((error: unknown) => {
        // Keep the chain alive: a transient write failure must not stop every later save.
        console.error("Suite Planner: could not write the workspace", error);
      });
    return this.#flushing;
  }

  async exportTo(target: string): Promise<void> {
    await writeFile(target, encodeWorkspaceFile(this.#doc), "utf8");
  }

  async importFrom(source: string): Promise<void> {
    const raw = await readFile(source, "utf8");
    const decoded = decodeWorkspaceFile(raw);
    if (decoded.isErr()) throw decoded.error;

    const next = WorkspaceDocument.fromSnapshot(decoded.value);
    const validation = next.validate();
    if (validation.isErr()) throw validation.error;

    this.#doc = next;
    await this.writeCurrent();
  }

  async close(): Promise<void> {
    await this.flush();
  }

  private async writeCurrent(): Promise<void> {
    const contents = encodeWorkspaceFile(this.#doc);
    const { workspace, backup, temp } = this.#paths;
    await writeFile(temp, contents, "utf8");
    try {
      await copyFile(workspace, backup);
    } catch {
      // First save: there is no previous file to keep.
    }
    await rename(temp, workspace);
  }
}

async function loadOrCreate(
  paths: WorkspacePaths,
): Promise<{ doc: WorkspaceDocument; created: boolean }> {
  for (const candidate of [paths.workspace, paths.backup]) {
    try {
      const raw = await readFile(candidate, "utf8");
      const decoded = decodeWorkspaceFile(raw);
      if (decoded.isErr()) {
        console.warn(
          `Suite Planner: ${candidate} is not a valid workspace (${decoded.error.code})`,
        );
        continue;
      }
      const doc = WorkspaceDocument.fromSnapshot(decoded.value);
      const validation = doc.validate();
      if (validation.isErr()) {
        console.warn(`Suite Planner: ${candidate} failed validation`, validation.error);
        continue;
      }
      return { doc, created: false };
    } catch {
      // The file does not exist yet; try the backup, then start a new workspace.
    }
  }
  return { doc: WorkspaceDocument.create(), created: true };
}
