import { dialog, ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";
import { FILTERS } from "../filters.js";
import { ServerManager } from "../ServerManager.js";

export function registerServerHandlers(
  appState: AppState,
  windowManager: WindowManager,
  serverManager: ServerManager,
) {
  function updateUIPort() {
    windowManager.sendToUIWindow("ui-update-port", appState.getPort());
  }

  ipcMain.on("ui-port-request", (_event) => {
    updateUIPort();
  })

  // ipcMain.on("ui-restart-server-request", (_event) => {
  //   serverManager.start(12345);
  // })
}
