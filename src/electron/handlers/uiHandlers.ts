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
      uiUpdaters.updateUISelectedLiveElementId();
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  });
  ipcMain.on("set-selected-live-element-id", (_event, id: number) => {
    appState.setSelectedLiveElementId(id);
    uiUpdaters.updateUISelectedLiveElementId();
  });

  ipcMain.on("prev-open-media", (_event) => {
    try {
      appState.decrementOpenMedia();
      uiUpdaters.updateUIOpenMedia();
      uiUpdaters.updateUISelectedLiveElementId();
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  });
  ipcMain.on("next-open-media", (_event) => {
    try {
      appState.incrementOpenMedia();
      uiUpdaters.updateUIOpenMedia();
      uiUpdaters.updateUISelectedLiveElementId();
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  });
  ipcMain.on("next-selected-element", (_event) => {
    appState.incrementSelectedLiveElementId();
    uiUpdaters.updateUISelectedLiveElementId();
  });
  ipcMain.on("prev-selected-element", (_event) => {
    appState.decrementSelectedLiveElement();
    uiUpdaters.updateUISelectedLiveElementId();
  });

}
