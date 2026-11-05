import type { ReminderEvent } from "@suite/planner-core";
import { app, BrowserWindow, Notification, type Tray } from "electron";

import { registerIpc } from "./ipc";
import { installMenu } from "./menu";
import { workspacePaths } from "./paths";
import { ReminderScheduler } from "./scheduler";
import { createTray } from "./tray";
import { applyContentSecurityPolicy, createMainWindow } from "./window";
import { adoptLegacyWorkspace } from "./workspaceLocation";
import { WorkspaceStore } from "./workspaceStore";

app.setName("Suite Planner");

if (process.env.SUITE_PLANNER_USER_DATA) {
  app.setPath("userData", process.env.SUITE_PLANNER_USER_DATA);
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let store: WorkspaceStore | null = null;
let scheduler: ReminderScheduler | null = null;
let quitting = false;
let cleanedUp = false;

/** Files handed over before a window existed. */
const pendingFiles: string[] = [];

/** The workspace file an argument names, if it names one. */
function workspaceFromArgv(argv: readonly string[]): string | null {
  for (const argument of argv.slice(1)) {
    if (argument.startsWith("-")) continue;
    if (/\.planner$/iu.test(argument)) return argument;
  }
  return null;
}

function notifyReminder(reminder: ReminderEvent): void {
  if (Notification.isSupported()) {
    const notification = new Notification({ title: "Suite Planner", body: reminder.title });
    notification.on("click", () => showWindow());
    notification.show();
  }
  mainWindow?.webContents.send("reminder:fired", reminder);
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const file = workspaceFromArgv(argv);
    if (file) {
      void openWorkspaceFile(file);
      return;
    }
    showWindow();
  });

  // Delivered before `ready`, so the listener is registered before it.
  app.on("open-file", (event, path) => {
    event.preventDefault();
    if (app.isReady() && store) {
      void openWorkspaceFile(path);
      return;
    }
    pendingFiles.push(path);
  });

  app
    .whenReady()
    .then(() => bootstrap(workspaceFromArgv(process.argv)))
    .catch((error: unknown) => {
      console.error("Suite Planner failed to start", error);
      app.quit();
    });

  app.on("before-quit", (event) => {
    if (cleanedUp) return;
    event.preventDefault();
    void shutdown();
  });

  app.on("window-all-closed", () => {
    // The tray keeps the reminder scheduler alive; quitting happens from the tray or the menu.
    // Without a tray there is no way back, so closing the last window quits.
    if (!tray) app.quit();
  });
}

async function bootstrap(initialFile: string | null): Promise<void> {
  applyContentSecurityPolicy();
  const paths = workspacePaths(initialFile);
  const legacyDir = app.getPath("userData");
  const copied = await adoptLegacyWorkspace(paths, legacyDir);
  if (copied.length > 0) console.info(`Suite Planner: copied the workspace from ${legacyDir}`);

  store = await WorkspaceStore.open(paths);
  registerIpc(() => {
    if (!store) throw new Error("Suite Planner: no workspace is open");
    return store;
  });

  scheduler = new ReminderScheduler(store, notifyReminder);
  scheduler.start();

  installMenu();
  openWindow();

  try {
    tray = createTray(showWindow, () => app.quit());
  } catch (error) {
    console.warn("Suite Planner: tray is unavailable, closing the window will quit", error);
  }

  app.on("activate", () => showWindow());

  for (const file of pendingFiles.splice(0)) await openWorkspaceFile(file);
}

/**
 * Open a file handed over by the operating system or by the hub.
 *
 * The store is replaced rather than merged: a planner window shows one workspace, and pointing it at
 * another file is the whole request. The previous store is flushed first, so nothing queued is lost.
 */
async function openWorkspaceFile(file: string): Promise<void> {
  if (!store) {
    pendingFiles.push(file);
    return;
  }
  const previous = store;
  const next = await WorkspaceStore.open(workspacePaths(file));
  await previous.close();
  scheduler?.stop();

  store = next;
  scheduler = new ReminderScheduler(next, notifyReminder);
  scheduler.start();

  const snapshot = next.snapshot();
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("workspace:replaced", snapshot);
  }
  showWindow();
}

function openWindow(): BrowserWindow {
  const window = createMainWindow();
  window.on("close", (event) => {
    if (quitting || !tray) return;
    event.preventDefault();
    window.hide();
  });
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });
  mainWindow = window;
  return window;
}

function showWindow(): void {
  if (!app.isReady()) return;
  if (!mainWindow) {
    openWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function shutdown(): Promise<void> {
  quitting = true;
  scheduler?.stop();
  await store?.close();
  cleanedUp = true;
  tray?.destroy();
  app.quit();
}
