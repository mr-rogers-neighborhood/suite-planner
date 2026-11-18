export type ReminderEvent = {
  taskId: string;
  title: string;
  remindAt: string;
};

export type AppCommand = "capture" | "today" | "inbox";

export type WorkspaceInfo = {
  path: string;
  schemaVersion: number;
};

export type ExportResult = { canceled: boolean; path?: string };

export type ImportResult = { canceled: boolean };

/**
 * The only surface the renderer has on the machine. Main implements it; preload exposes it through
 * contextBridge; tests and Storybook use an in-memory implementation.
 */
export type PlannerBridge = {
  /**
   * The document to open, or `null` when there is not one yet.
   *
   * `null` is not an error and not a shrug: it is the host saying "nothing is here", which is the
   * one answer a container can honestly give. `fromSnapshot` needs a schema-initialised snapshot,
   * and a container that hosts Planner has no way to produce one that stays valid as the schema
   * moves — so inventing the document belongs to the app, not the host.
   *
   * A host that always has bytes (the desktop shell always opens a file) never returns it.
   */
  loadSnapshot(): Promise<Uint8Array | null>;
  /**
   * Take the document the app just made, once, on a first run.
   *
   * A host that answered `null` has no document and cannot make one — manufacturing a
   * schema-initialised snapshot would be the host knowing a domain. So the app hands its first
   * document back, before the person can edit it, and the host keeps it as the file.
   *
   * This is not a convenience. A host that only ever receives `commit(update)` gets the deltas that
   * come *after* creation, and a document rebuilt from those is missing its schema: the emitted
   * update after `WorkspaceDocument.create()` carries no meta at all. Optional, because a host that
   * always had a document from a file has nothing to adopt.
   */
  adopt?(snapshot: Uint8Array): Promise<void>;
  /**
   * Whether this session started with no workspace file, which is when a start screen is due.
   *
   * Optional on purpose. A host that hands a document over, rather than letting the app read or
   * invent one, has no such distinction to report, and it must not be forced to invent an answer
   * to boot the renderer. Absent reads as `false`, which sends the person straight to the
   * document, which is the right outcome for a container.
   */
  wasCreated?(): Promise<boolean>;
  commit(update: Uint8Array): Promise<void>;
  onWorkspaceReplaced(listener: (snapshot: Uint8Array) => void): () => void;
  onReminder(listener: (reminder: ReminderEvent) => void): () => void;
  onCommand(listener: (command: AppCommand) => void): () => void;
  exportWorkspace(): Promise<ExportResult>;
  importWorkspace(): Promise<ImportResult>;
  info(): Promise<WorkspaceInfo>;
  platform(): Promise<string>;
};
