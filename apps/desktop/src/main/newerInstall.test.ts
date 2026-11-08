import { describe, expect, it } from "vitest";
import { compareVersions, findNewerInstall } from "./newerInstall";

const tree = (layout: Record<string, readonly string[]>) => ({
  readdir: (path: string): readonly string[] => {
    const hit = Object.entries(layout).find(([dir]) => path.endsWith(dir));
    if (hit === undefined) throw new Error(`ENOENT ${path}`);
    return hit[1];
  },
  isFile: (path: string) => !Object.keys(layout).some((dir) => path.endsWith(`/${dir}`)),
});

const base = {
  running: "0.2.1",
  applicationsRoot: "/home/me/Applications/Suite",
  appDir: "Planner",
  binaryPrefix: "suite-planner",
};

describe("compareVersions", () => {
  it("orders by number, not by text", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("0.2.1", "0.2.1")).toBe(0);
    expect(compareVersions("0.2.0", "0.2.1")).toBeLessThan(0);
  });

  it("does not treat a pre-release as an upgrade", () => {
    expect(compareVersions("0.3.0-beta.1", "0.3.0")).toBe(0);
  });
});

describe("findNewerInstall", () => {
  it("finds the newest installed binary when it is newer than the running one", () => {
    const inspect = tree({
      Suite: ["Planner"],
      Planner: ["0.1.2", "0.2.1", "0.3.0"],
      "0.1.2": ["suite-planner-0.1.2.AppImage"],
      "0.2.1": ["suite-planner-0.2.1.AppImage"],
      "0.3.0": ["suite-planner-0.3.0.AppImage"],
    });
    expect(findNewerInstall(base, inspect)).toEqual({
      version: "0.3.0",
      execPath: "/home/me/Applications/Suite/Planner/0.3.0/suite-planner-0.3.0.AppImage",
    });
  });

  it("is silent when the running version is the newest", () => {
    const inspect = tree({
      Suite: ["Planner"],
      Planner: ["0.2.0", "0.2.1"],
      "0.2.0": ["suite-planner-0.2.0.AppImage"],
      "0.2.1": ["suite-planner-0.2.1.AppImage"],
    });
    expect(findNewerInstall(base, inspect)).toBeNull();
  });

  it("is silent when the user has no installed copy, which is most of the time", () => {
    expect(findNewerInstall(base, tree({ Suite: ["Canvas"] }))).toBeNull();
  });

  it("skips a newer version directory that holds no binary", () => {
    // A half-written install must not become a relaunch target that cannot start.
    const inspect = tree({
      Suite: ["Planner"],
      Planner: ["0.2.1", "0.3.0"],
      "0.2.1": ["suite-planner-0.2.1.AppImage"],
      "0.3.0": [],
    });
    expect(findNewerInstall(base, inspect)).toBeNull();
  });

  it("respects a renamed binary rather than guessing the version into the filename", () => {
    const inspect = tree({
      Suite: ["Planner"],
      Planner: ["0.3.0"],
      "0.3.0": ["suite-planner"],
    });
    expect(findNewerInstall(base, inspect)?.execPath).toBe(
      "/home/me/Applications/Suite/Planner/0.3.0/suite-planner",
    );
  });
});
