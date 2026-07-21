import { dialog, ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";
import { UIUpdaters } from "./UIUpdaters.js";

export function registerUIHandlers(
  appState: AppState,
  windowManager: WindowManager
) {
  const uiUpdaters = new UIUpdaters(appState, windowManager);

  ipcMain.on("ui-state-request", (_event) => { uiUpdaters.updateAllUI(); });

  ipcMain.on("set-open-media", (_event, id: number | null) => {
    try {
      appState.setOpenMedia(id);
      uiUpdaters.updateUIOpenMedia();
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  });
}
