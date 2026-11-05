import { copyFile, mkdir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

/**
 * Where a planner workspace lives on disk.
 *
 * The file goes where a person looks for it, under `Documents/Suite/Planner`, so it can be copied,
 * backed up or put in a folder their own cloud already syncs. Its backup and temporary file sit
 * beside it for the same reason: recovery with a file manager is what the naming promises.
 *
 * Nothing here reads Electron or the environment, so the layout and the migration below are a test
 * rather than something only a running window can demonstrate.
 */
export type WorkspacePaths = {
  dir: string;
  workspace: string;
  backup: string;
  temp: string;
};

/**
 * The paths for one workspace file, or the default file in `documents`.
 *
 * A file can be handed over by the operating system or by the hub, so the layout follows whatever
 * name it arrives with rather than assuming the default one.
 */
export function workspacePathsFrom(documents: string, file?: string | null): WorkspacePaths {
  const chosen = file?.trim();
  const workspace = chosen ? chosen : join(documents, "workspace.planner");
  const dir = dirname(workspace);
  const stem = basename(workspace).replace(/\.planner$/u, "");
  return {
    dir,
    workspace,
    backup: join(dir, `${stem}.backup.planner`),
    temp: `${workspace}.tmp`,
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a workspace kept in the old application directory into the documents folder.
 *
 * Runs once: with the destination already there, nothing happens. The original stays where it was,
 * because a migration that deletes the only copy on a hunch is how a person loses a year of tasks.
 * It answers the paths it copied, which is what a log line and a test need.
 */
export async function adoptLegacyWorkspace(
  destination: WorkspacePaths,
  legacyDir: string,
): Promise<readonly string[]> {
  if (destination.dir === legacyDir) return [];
  if (await exists(destination.workspace)) return [];

  const legacyWorkspace = join(legacyDir, "workspace.planner");
  if (!(await exists(legacyWorkspace))) return [];

  await mkdir(destination.dir, { recursive: true });
  await copyFile(legacyWorkspace, destination.workspace);
  const copied = [destination.workspace];

  const legacyBackup = join(legacyDir, "workspace.backup.planner");
  if ((await exists(legacyBackup)) && !(await exists(destination.backup))) {
    await copyFile(legacyBackup, destination.backup);
    copied.push(destination.backup);
  }
  return copied;
}
