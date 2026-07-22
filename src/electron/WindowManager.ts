import { BrowserWindow, dialog, app } from "electron";
import path from "path";
import { IpcWs } from "./IpcWs.js";
import { getPreloadPath } from "./pathResolver.js";
import { isDev } from "./util.js";

class WindowManager {
  #uiWindow: BrowserWindow | null = null;
  #displayWindows: BrowserWindow[] = [];
  #hasConfirmedUiWindowClose: boolean = false;

  #ipcws: IpcWs;

  constructor(ipcws: IpcWs) {
    this.#ipcws = ipcws;
  }

  get uiWindow() {
    return this.#uiWindow;
  }

  get displayWindows() {
    return this.#displayWindows;
  }

  createUiWindow() {
    this.#uiWindow = new BrowserWindow({
      title: `Sinai Project`,
      minWidth: 500,
      minHeight: 500,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: getPreloadPath("ui"),
      },
    });
    this.#uiWindow.setMenu(null);


    this.#uiWindow.on("close", (event) => {
      if (!this.#hasConfirmedUiWindowClose) {
        event.preventDefault();
        dialog.showMessageBox(this.#uiWindow!, {
          message: "Estás seguro que quieres cerrar Sinai Project?",
          type: "warning",
          buttons: ["Ok", "Cancel"],
          defaultId: 1,
          cancelId: 1,
        }).then(value => {
          if (value.response === 0) {
            this.#hasConfirmedUiWindowClose = true;
            this.#uiWindow!.close();
            // FIXME: looks to do nothing
            // for (let i = 0; i < DISPLAYS; i++) {
            //   ipcMain.emit("set-live-element", i, null);
            // }
            app.quit();
          }
        });
      }
    });

    if (isDev()) {
      this.#uiWindow.loadURL("http://localhost:5123");
      this.#uiWindow.webContents.openDevTools();
    } else {
      this.#uiWindow.loadFile(path.join(app.getAppPath(), "/dist-ui/index.html"));
    }
  }

  sendToUIWindow(channel: string, ...args: any[]) {
    if (!this.#uiWindow) return;
    this.#uiWindow.webContents.send(channel, ...args);
    this.#ipcws.broadcastToWsClients(channel, ...args);
  }


  createDisplayWindow(displayId: number) {
    console.log("createDisplayWindow", displayId);
    const displayWindow = new BrowserWindow({
      title: `Sinai Project: Display Window ${displayId + 1}`,
      webPreferences: {

        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: getPreloadPath("display"),
      },
    });

    displayWindow.setMenu(null);

    displayWindow.on("close", () => {
      this.#displayWindows.splice(this.#displayWindows.indexOf(displayWindow), 1);
    })
    displayWindow.webContents.addListener("before-input-event", (_event, input) => {
      if (input.type === "keyDown" && input.control && input.key === "i")
        displayWindow.webContents.openDevTools();
    })

    if (isDev()) {
      displayWindow.loadURL(`http://localhost:5124?displayId=${displayId}`);
      displayWindow.webContents.openDevTools();
    } else {
      displayWindow.loadFile(
        path.join(app.getAppPath(), "/dist-display/index.html"),
        { query: { displayId: displayId.toString() } }
      );
    }

    this.#displayWindows.push(displayWindow);
    return displayWindow;
  }

  sendToDisplayWindows(channel: string, ...args: any[]) {
    this.#displayWindows.forEach(dw => {
      if (dw)
        dw.webContents.send(channel, ...args);
    })
    this.#ipcws.broadcastToWsClients(channel, ...args);
  }

}

export { WindowManager }
