import type { AppCommand } from "@suite/planner-core";
import { BrowserWindow, Menu, type MenuItemConstructorOptions } from "electron";

function send(command: AppCommand): void {
  BrowserWindow.getFocusedWindow()?.webContents.send("ui:command", command);
}

export function installMenu(): void {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" as const }] : []),
    {
      label: "File",
      submenu: [
        { label: "New Task", accelerator: "CmdOrCtrl+N", click: () => send("capture") },
        { label: "Today", accelerator: "CmdOrCtrl+1", click: () => send("today") },
        { label: "Inbox", accelerator: "CmdOrCtrl+2", click: () => send("inbox") },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
