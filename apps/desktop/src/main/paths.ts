import { suitePaths } from "@suite/contracts";
import { app } from "electron";

import { type WorkspacePaths, workspacePathsFrom } from "./workspaceLocation";

export type { WorkspacePaths };

/**
 * Where the suite convention puts planner's documents.
 *
 * `SUITE_PLANNER_LIBRARY` replaces the folder for a test and a portable install; it is never read
 * from a document, so no file can steer a write.
 */
function workspaceFolder(): string {
  return suitePaths("Planner", {
    platform: process.platform,
    home: app.getPath("home"),
    documentsOverride: process.env.SUITE_PLANNER_LIBRARY,
    xdgDataHome: process.env.XDG_DATA_HOME,
  }).documents;
}

/** The paths for the default workspace, or for the file a caller names. */
export function workspacePaths(file?: string | null): WorkspacePaths {
  return workspacePathsFrom(workspaceFolder(), file);
}
