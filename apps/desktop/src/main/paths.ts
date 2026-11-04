import { join } from "node:path";

import { app } from "electron";

export type WorkspacePaths = {
  dir: string;
  workspace: string;
  backup: string;
  temp: string;
};

export function workspacePaths(): WorkspacePaths {
  const dir = app.getPath("userData");
  return {
    dir,
    workspace: join(dir, "workspace.gradient"),
    backup: join(dir, "workspace.backup.gradient"),
    temp: join(dir, "workspace.gradient.tmp"),
  };
}
