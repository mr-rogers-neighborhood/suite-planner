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
  commit(update: Uint8Array): Promise<void>;
  onWorkspaceReplaced(listener: (snapshot: Uint8Array) => void): () => void;
  onReminder(listener: (reminder: ReminderEvent) => void): () => void;
  onCommand(listener: (command: AppCommand) => void): () => void;
  exportWorkspace(): Promise<ExportResult>;
  importWorkspace(): Promise<ImportResult>;
  info(): Promise<WorkspaceInfo>;
  platform(): Promise<string>;
};
