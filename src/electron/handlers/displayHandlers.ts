import { ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";
import { IpcWs } from "../IpcWs.js";
import { SerializedLiveState } from "../../shared/media-classes.js";

export function registerDisplayHandlers(
  appState: AppState,
  windowManager: WindowManager,
  ipcws: IpcWs
) {
  ipcMain.on("new-display-window", (_event, id: number) => {
    windowManager.createDisplayWindow(id);
  });
  // so that windows automatically start displaying upon creation
  ipcws.handle("invoke-display-get-init-live-state", (displayId): SerializedLiveState => {
    return {
      liveElement: appState.getDisplayStateLiveElement(displayId),
      logo: appState.getLogoEntry(displayId),
    }
  })
}
