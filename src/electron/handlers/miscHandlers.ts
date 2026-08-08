import { dialog, ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";

export function registerMiscHandlers(
  appState: AppState,
  windowManager: WindowManager,
) {
  ipcMain.on("alert", (_event, message: string) => {
    dialog.showErrorBox("Error", message);
  });
}
