import { dialog, ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";
import { UIUpdaters } from "./UIUpdaters.js";
import { LiveElementIdentifier } from "../../shared/media-classes.js";
import { DisplayUpdaters } from "./DisplayUpdaters.js";

export function registerLiveHandlers(
  appState: AppState,
  windowManager: WindowManager
) {
  const uiUpdaters = new UIUpdaters(appState, windowManager);
  const displayUpdaters = new DisplayUpdaters(appState, windowManager);

  ipcMain.on("set-live-element", (_event, displayId: number, liveElementIdentifier: LiveElementIdentifier | null) => {
    try {
      appState.setLiveElement(displayId, liveElementIdentifier);
      uiUpdaters.updateUILiveElements();
      displayUpdaters.updateDisplayLiveElement(displayId);
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  })

  ipcMain.on("set-logo", (_event, displayIndex: number, logo: boolean) => {
    try {
      appState.setLogo(displayIndex, logo);
      uiUpdaters.updateUILogo();
      displayUpdaters.updateDisplayLogo(displayIndex);
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  });
}
