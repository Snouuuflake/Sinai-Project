import { dialog, ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";
import { FILTERS } from "../filters.js";

export function registerConfigHandlers(
  appState: AppState,
  windowManager: WindowManager
) {
  function updateDisplayConfig() {
    windowManager.sendToUIWindow("ui-update-display-config",
      appState.getSerializedDc()
    )
    windowManager.sendToDisplayWindows("display-update-display-config",
      appState.getSerializedDc()
    )
  }

  ipcMain.on("ui-display-config-request", (_event) => {
    updateDisplayConfig();
  });
  ipcMain.on("ui-set-display-config-entry", (_event, id, index, value) => {
    try {
      appState.updateDcEntry(id, index, value);
      updateDisplayConfig();
    } catch (err) {
      if (err instanceof Error) {
        dialog.showErrorBox("Error", err.message);
      }
    }
  });
  ipcMain.on("ui-reset-display-config-entry", (_event, id, index) => {
    try {
      appState.resetDcEntry(id, index);
      updateDisplayConfig();
    } catch (err) {
      if (err instanceof Error) {
        dialog.showErrorBox("Error", err.message);
      }
    }
  });

  function imageDialog(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (windowManager.uiWindow)
        dialog.showOpenDialog(
          windowManager.uiWindow,
          {
            title: "Add Media Images",
            filters: [
              FILTERS["Images"] as any
            ],
            properties: ["openFile"]
          }).then(
            result => {
              if (result.canceled) reject();
              resolve(result.filePaths[0]);
            }
          )
    })
  }

  ipcMain.on("ui-display-config-input-path", (_event, id, displayId) => {
    imageDialog().then(
      res => {
        appState.updateDcEntry(id, displayId, res);
        updateDisplayConfig();
      },
      (reason) => { }
    );
  });

  function updateUIGeneralConfig() {
    windowManager.sendToUIWindow("ui-update-general-config",
      appState.getSerializedGc()
    )
  }
  ipcMain.on("ui-general-config-request", (_event) => {
    updateUIGeneralConfig();
  });
  ipcMain.on("ui-set-general-config-entry", (_event, id, value) => {
    try {
      appState.updateGcEntry(id, value);
      updateUIGeneralConfig();
    } catch (err) {
      if (err instanceof Error) {
        dialog.showErrorBox("Error", err.message);
      }
    }
  });
  ipcMain.on("ui-reset-general-config-entry", (_event, id) => {
    try {
      appState.resetGcEntry(id);
      updateUIGeneralConfig();
    } catch (err) {
      if (err instanceof Error) {
        dialog.showErrorBox("Error", err.message);
      }
    }
  });

  ipcMain.on("ui-general-config-input-path", (_event, id, displayId) => {
    imageDialog().then(
      res => {
        appState.updateGcEntry(id, res);
        updateUIGeneralConfig();
      },
      (_reason) => { }
    );
  });
}

