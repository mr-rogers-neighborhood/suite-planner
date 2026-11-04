import { join } from "node:path";

import { app, Menu, nativeImage, Tray } from "electron";

export function createTray(showWindow: () => void, quit: () => void): Tray {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, "tray.png")
    : join(__dirname, "../../resources/tray.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });

  const tray = new Tray(icon);
  tray.setToolTip("Suite Planner");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open Suite Planner", click: showWindow },
      { type: "separator" },
      { label: "Quit", click: quit },
    ]),
  );
  tray.on("click", showWindow);
  return tray;
}
