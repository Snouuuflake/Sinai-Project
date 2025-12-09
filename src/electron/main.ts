import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getConfigPath, getPreloadPath } from "./pathResolver.js";
// import { readMSSFile, writeMSSFile } from "./parser.js";
import { Media, MediaImage, MediaImageValueType, UIState } from "../shared/media-classes.js";
import * as constants from "../shared/constants.js";
import * as fs from "fs";

class AppState {
  #setlist: number[] = [];
  #media: Map<number, Media> = new Map();
  #mediaIdCounter: number = 0;
  /*
    live-elements: {
      string: LiveElement | null;
    }
    in constructor:
    range(constants.DISPLAYS) -> "i": null;
   */
  constructor() {
  }
  addMedia(media: Media) {
    this.#media.set(this.#mediaIdCounter, media);
    this.#setlist.push(this.#mediaIdCounter);
    this.#mediaIdCounter++;
  }
  getUIState(): UIState {
    return {
      setlist: this.#setlist.map(id => this.#media.get(id)!.toSerializedMediaWithId(id)),
    }
  }
}

let uiWindow: BrowserWindow;

const appState = new AppState();
for (let index = 0; index < 50; index++) {
  appState.addMedia(new MediaImage("an image!", { path: path.join(app.getAppPath(), "test-files/", "lizard cat.jpg") }))
}



function sendToUIWindow(channel: string, ...args: any[]) {
  if (!uiWindow) return;
  uiWindow.webContents.send(channel, ...args);
}

function updateUI() {
  sendToUIWindow("ui-state-update", appState.getUIState());
}

ipcMain.on("ui-state-request", (_event) => { updateUI(); });


app.on("ready", () => {
  uiWindow = new BrowserWindow({
    minWidth: 500,
    minHeight: 500,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  uiWindow.setMenu(null);

  if (isDev()) {
    uiWindow.loadURL("http://localhost:5123");
    uiWindow.webContents.openDevTools();
  } else {
    uiWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("_alert", (_event, message: string) => {
  dialog.showMessageBox({ message: message });
});

