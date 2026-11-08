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
  loadSnapshot(): Promise<Uint8Array>;
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
