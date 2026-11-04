import { app, type BrowserWindow, Notification, type Tray } from "electron";

import { registerIpc } from "./ipc";
import { installMenu } from "./menu";
import { workspacePaths } from "./paths";
import { ReminderScheduler } from "./scheduler";
import { createTray } from "./tray";
import { applyContentSecurityPolicy, createMainWindow } from "./window";
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

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());

  app
    .whenReady()
    .then(bootstrap)
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

async function bootstrap(): Promise<void> {
  applyContentSecurityPolicy();
  store = await WorkspaceStore.open(workspacePaths());
  registerIpc(store);

  scheduler = new ReminderScheduler(store, (reminder) => {
    if (Notification.isSupported()) {
      const notification = new Notification({ title: "Suite Planner", body: reminder.title });
      notification.on("click", () => showWindow());
      notification.show();
    }
    mainWindow?.webContents.send("reminder:fired", reminder);
  });
  scheduler.start();

  installMenu();
  openWindow();

  try {
    tray = createTray(showWindow, () => app.quit());
  } catch (error) {
    console.warn("Suite Planner: tray is unavailable, closing the window will quit", error);
  }

  app.on("activate", () => showWindow());
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
