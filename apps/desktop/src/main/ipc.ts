import { join } from "node:path";
import { isTrustedSender } from "@suite/desktop";
import { todayKey } from "@suite/planner-core";

import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { z } from "zod";
import { pageOrigins } from "./protocol";
import type { WorkspaceStore } from "./workspaceStore";

const updateSchema = z.custom<Uint8Array>((value) => value instanceof Uint8Array, {
  message: "Expected a binary CRDT update",
});

/**
 * Register a channel, but only answer the page this app loaded.
 *
 * Electron's checklist asks every handler to validate the sender.
 */
function onIpc(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => unknown,
): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedSender(event.senderFrame?.url, pageOrigins())) return undefined;
    return handler(event, ...args);
  });
}

/**
 * Register the renderer's channels against whatever workspace is open.
 *
 * The getter rather than the store itself: a file handed over by the hub replaces the workspace, and
 * `ipcMain.handle` refuses a second registration for the same channel.
 */
export function registerIpc(getStore: () => WorkspaceStore): void {
  onIpc("workspace:snapshot", () => getStore().snapshot());

  onIpc("workspace:commit", (_event, payload: unknown) => {
    getStore().commit(updateSchema.parse(payload));
  });

  onIpc("workspace:info", () => ({
    path: getStore().path,
    schemaVersion: getStore().document.getMeta().schemaVersion,
  }));

  onIpc("workspace:export", async (event) => {
    const options = {
      title: "Export workspace",
      defaultPath: join(app.getPath("documents"), `planner-${todayKey()}.planner`),
      filters: [{ name: "Suite Planner workspace", extensions: ["planner"] }],
    };
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) return { canceled: true };
    await getStore().exportTo(result.filePath);
    return { canceled: false, path: result.filePath };
  });

  onIpc("workspace:import", async (event) => {
    const options: OpenDialogOptions = {
      title: "Import workspace",
      properties: ["openFile"],
      filters: [{ name: "Suite Planner workspace", extensions: ["planner"] }],
    };
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) return { canceled: true };

    await getStore().importFrom(filePath);
    const snapshot = getStore().snapshot();
    for (const openWindow of BrowserWindow.getAllWindows()) {
      openWindow.webContents.send("workspace:replaced", snapshot);
    }
    return { canceled: false };
  });

  onIpc("app:platform", () => process.platform);
}
