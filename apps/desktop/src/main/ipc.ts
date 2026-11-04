import { join } from "node:path";
import { todayKey } from "@gradient/core";
import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { z } from "zod";

import type { WorkspaceStore } from "./workspaceStore";

const updateSchema = z.custom<Uint8Array>((value) => value instanceof Uint8Array, {
  message: "Expected a binary CRDT update",
});

export function registerIpc(store: WorkspaceStore): void {
  ipcMain.handle("workspace:snapshot", () => store.snapshot());

  ipcMain.handle("workspace:commit", (_event, payload: unknown) => {
    store.commit(updateSchema.parse(payload));
  });

  ipcMain.handle("workspace:info", () => ({
    path: store.path,
    schemaVersion: store.document.getMeta().schemaVersion,
  }));

  ipcMain.handle("workspace:export", async (event) => {
    const options = {
      title: "Export workspace",
      defaultPath: join(app.getPath("documents"), `gradient-${todayKey()}.gradient`),
      filters: [{ name: "Gradient workspace", extensions: ["gradient"] }],
    };
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) return { canceled: true };
    await store.exportTo(result.filePath);
    return { canceled: false, path: result.filePath };
  });

  ipcMain.handle("workspace:import", async (event) => {
    const options: OpenDialogOptions = {
      title: "Import workspace",
      properties: ["openFile"],
      filters: [{ name: "Gradient workspace", extensions: ["gradient"] }],
    };
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) return { canceled: true };

    await store.importFrom(filePath);
    const snapshot = store.snapshot();
    for (const openWindow of BrowserWindow.getAllWindows()) {
      openWindow.webContents.send("workspace:replaced", snapshot);
    }
    return { canceled: false };
  });

  ipcMain.handle("app:platform", () => process.platform);
}
