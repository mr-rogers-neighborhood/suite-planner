import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface NewerInstall {
  readonly version: string;
  /** The binary to hand `app.relaunch()`. */
  readonly execPath: string;
}

interface Inspect {
  readonly readdir?: (path: string) => readonly string[];
  readonly isFile?: (path: string) => boolean;
}

/**
 * Compare two dotted versions. Numeric segments only, which is all this tree publishes.
 *
 * A pre-release suffix is ignored rather than ordered: the question this answers is "is a newer
 * *release* installed", and 0.3.0-beta is not a reason to restart someone's window.
 */
export function compareVersions(left: string, right: string): number {
  const parts = (value: string) =>
    (value.split("-")[0] ?? "0")
      .split(".")
      .map((segment) => Number.parseInt(segment, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));
  const a = parts(left);
  const b = parts(right);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * The newest version installed under `<applications>/<app>/`, if it is newer than `running`.
 *
 * This exists because the hub can install a new Planner while an old one is still alive. Start
 * launches the new binary, that binary loses `requestSingleInstanceLock()` to the old process,
 * and the old process raises its own window: the update silently did not happen, and nothing
 * said so. Planner is the only app that keeps a tray, so it is the only one where closing the
 * window does not stop the process, which is why only Planner appeared to ignore updates.
 *
 * Returns `null` for every ordinary case: nothing newer, a missing directory, an install with no
 * binary in it. A caller that cannot tell what to do should do nothing.
 */
export function findNewerInstall(
  input: {
    readonly running: string;
    readonly applicationsRoot: string;
    readonly appDir: string;
    /** The binary's name inside a version directory, so a renamed build still resolves. */
    readonly binaryPrefix: string;
  },
  inspect: Inspect = {},
): NewerInstall | null {
  const readdir = inspect.readdir ?? ((path: string) => readdirSync(path));
  const isFile =
    inspect.isFile ??
    ((path: string) => {
      try {
        return statSync(path).isFile();
      } catch {
        return false;
      }
    });

  const versionsDir = join(input.applicationsRoot, input.appDir);
  let versions: readonly string[];
  try {
    versions = readdir(versionsDir);
  } catch {
    return null;
  }

  const newer = versions
    .filter((name) => compareVersions(name, input.running) > 0)
    .sort((a, b) => compareVersions(b, a));

  for (const version of newer) {
    const dir = join(versionsDir, version);
    let entries: readonly string[];
    try {
      entries = readdir(dir);
    } catch {
      continue;
    }
    const binary = entries
      .filter((name) => name.startsWith(input.binaryPrefix))
      .map((name) => join(dir, name))
      .find(isFile);
    if (binary !== undefined) return { version, execPath: binary };
  }

  return null;
}
