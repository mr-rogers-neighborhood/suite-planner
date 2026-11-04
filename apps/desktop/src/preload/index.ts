import type { AppCommand, PlannerBridge, ReminderEvent } from "@suite/planner-core";
import { contextBridge, ipcRenderer } from "electron";

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const bridge: PlannerBridge = {
  loadSnapshot: () => ipcRenderer.invoke("workspace:snapshot"),
  commit: (update) => ipcRenderer.invoke("workspace:commit", update),
  onWorkspaceReplaced: (listener) =>
    subscribe<Uint8Array>("workspace:replaced", (snapshot) => listener(snapshot)),
  onReminder: (listener) => subscribe<ReminderEvent>("reminder:fired", listener),
  onCommand: (listener) => subscribe<AppCommand>("ui:command", listener),
  exportWorkspace: () => ipcRenderer.invoke("workspace:export"),
  importWorkspace: () => ipcRenderer.invoke("workspace:import"),
  info: () => ipcRenderer.invoke("workspace:info"),
  platform: () => ipcRenderer.invoke("app:platform"),
};

contextBridge.exposeInMainWorld("suitePlanner", bridge);
