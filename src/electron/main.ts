import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron";
import { pathToFileURL } from "url";
import path, { parse } from "path";
import { isDev } from "./util.js";
import { getConfigPath, getPreloadPath } from "./pathResolver.js";
import {
  SerializedLiveElement,
  LiveElementIdentifier,
  Media,
  MediaImage,
  MediaImageValueType,
  SerializedMediaIdentifier,
  SerializedMediaWithId,
} from "../shared/media-classes.js";
import { DISPLAYS } from "../shared/constants.js";
import * as constants from "../shared/constants.js";
import * as fs from "fs";
import { parseSong, logSong } from "./parser.js";

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
      bypassCSP: false
    }
  }
]);

fs.readFile(
  path.join(app.getAppPath(), "test-files/", "our-god.txt"),
  "utf8",
  (err, data) => {
    if (err) {
      console.error(err)
    } else {
      try {
        logSong(parseSong(data));
      } catch (e) {
        console.error(e);
      }
    }
    process.exit(1);
  }
)

class AppState {
  #setlist: number[] = [];
  #media: Map<number, Media> = new Map();
  #mediaIdCounter: number = 0;
  #openMedia: number | null = null;
  #liveElements: Array<LiveElementIdentifier | null> = Array.from({ length: DISPLAYS }, (_x) => null);
  /*
    live-elements: {
      string: LiveElement | null;
    }
    in constructor:
    range(constants.DISPLAYS) -> "i": null;
   */
  constructor() {
  }
  get media(): Map<number, Media> {
    return new Map(this.#media);
  }
  getUIStateSetlist(): SerializedMediaIdentifier[] {
    return this.#setlist.map(id => this.#media.get(id)!.toSerializedMediaIdentifier(id));
  }
  getUIStateOpenMedia(): SerializedMediaWithId | null {
    if (this.#openMedia === null) return null;
    return this.#media.get(this.#openMedia)!
      .toSerializedMediaWithId(this.#openMedia);
  }
  getUIStateLiveElements(): Array<LiveElementIdentifier | null> {
    return [...this.#liveElements];
  }
  getDisplayStateLiveElement(displayId: number): SerializedLiveElement | null {
    const le = this.#liveElements[displayId] ?? null;
    if (le === null) return null;
    return this.#media.get(le.id)?.toSerializedLiveElement(le.id, le.element) ?? null;
  }
  setOpenMedia(id: number | null) {
    if (id == null) {
      this.#openMedia = null;
      return;
    }
    if (!this.#media.get(id)) {
      throw new Error("setOpenMedia: id not in this.media")
    }
    this.#openMedia = id;
  }
  /**
   * @param index display window index to set 
   * @param id media id of new live media
   */
  setLiveElement(index: number, liveElementIdentifier: LiveElementIdentifier | null) {
    if (index < 0 || index >= DISPLAYS) {
      throw new Error("setLiveElements: index is invalid");
    }
    if (liveElementIdentifier === null) {
      this.#liveElements[index] = null;
      return;
    }
    if (!this.#media.get(liveElementIdentifier.id)) {
      throw new Error("setLiveElements: id not in this.#media");
    }
    this.#liveElements[index] = liveElementIdentifier;
    console.log("setLiveElement result", this.#liveElements);
    return;
  }
  /**
   * @param id id of media to be moved 
   * @param index index isnide setlist to put it's id 
   */
  moveSetlistMedia(id: number, index: number) {
    if (this.#setlist.indexOf(id) == -1) {
      throw new Error("moveSetlistMedia: id not in this.#setlist")
    }
    if (!this.#media.get(id)) {
      throw new Error("moveSetlistMedia: id not in this.#media")
    }
    if (index >= this.#setlist.length) {
      throw new Error(
        "moveSetlistMEdia: index is greater than this.#setlist.length"
      );
    }

    const itemSetlistIndex = this.#setlist.indexOf(id);

    this.#setlist.splice(itemSetlistIndex, 1);
    this.#setlist.splice(index, 0, id);
  }
  addMedia(media: Media) {
    this.#media.set(this.#mediaIdCounter, media);
    this.#setlist.push(this.#mediaIdCounter);
    this.#mediaIdCounter++;
  }
  /**
   * @param id id of item to remove 
   */
  deleteMedia(id: number) {
    if (this.#setlist.indexOf(id) == -1) {
      throw new Error("deleteMedia: id not in this.#setlist")
    }
    if (!this.#media.get(id)) {
      throw new Error("deleteMedia: id not in this.#media")
    }
    this.#setlist.splice(this.#setlist.indexOf(id), 1);
    this.#media.delete(id);

    if (this.#openMedia === id) {
      this.setOpenMedia(null);
    }
  }
}

let uiWindow: BrowserWindow;
const displayWindows: BrowserWindow[] = []

function createDisplayWindow(displayId: number) {
  const displayWindow = new BrowserWindow({
    title: `Sinai Worship: Display Window ${displayId + 1}`,
    webPreferences: {
      preload: path.join(app.getAppPath(),
        isDev() ? "." : "..",
        "dist-electron/electron/preload.cjs"
      ),
    },
  });

  displayWindow.setMenu(null);

  displayWindow.on("close", () => {
    displayWindows.splice(displayWindows.indexOf(displayWindow), 0);
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

  displayWindows.push(displayWindow);
  return displayWindow;
}

const appState = new AppState();

ipcMain.on("new-display-window", (_event, id: number) => {
  createDisplayWindow(id);
});

/* ------- ui ipc ------- */
function alertMessageBox(message: string) {
  dialog.showMessageBox({ message: message });
}

ipcMain.on("_alert", (_event, message: string) => {
  alertMessageBox(message);
});

function sendToUIWindow(channel: string, ...args: any[]) {
  if (!uiWindow) return;
  uiWindow.webContents.send(channel, ...args);
}

function updateUISetlist() {
  sendToUIWindow("ui-state-update-setlist", appState.getUIStateSetlist());
}

function updateUIOpenMedia() {
  sendToUIWindow("ui-state-update-open-media", appState.getUIStateOpenMedia());
}

function updateUILiveElements() {
  sendToUIWindow("ui-state-update-live-elements", appState.getUIStateLiveElements());
}

function updateAllUI() {
  updateUISetlist();
  updateUIOpenMedia();
  updateUILiveElements();
}

ipcMain.on("ui-state-request", (_event) => { updateAllUI(); });

/* ----- display ipc ----- */

function sendToDisplayWinows(channel: string, ...args: any[]) {
  displayWindows.forEach(dw => {
    if (dw)
      dw.webContents.send(channel, ...args);
  })
}

function updateDisplayLiveElement(displayId: number) {
  sendToDisplayWinows(
    "display-state-update-live-elements",
    displayId,
    appState.getDisplayStateLiveElement(displayId)
  );
}


/* on setlist operations */
ipcMain.on("add-images", (_event) => {
  if (!uiWindow)
    return;
  dialog.showOpenDialog(uiWindow, {
    title: "Add Media Images",
    filters: [
      {
        name: "Images", extensions: [
          "apng", "gif", "ico", "cur", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg",
        ]
      },
    ],
    properties: ["openFile", "multiSelections"]
  }).then(
    result => {
      if (result.canceled) return;
      result.filePaths.map(fp => new MediaImage(
        fp.split(path.sep).at(-1) ?? "Image", fp)
      ).forEach(mi => appState.addMedia(mi));
      updateUISetlist();
    }
  )
});

ipcMain.on("move-media", (_event, id: number, index: number) => {
  try {
    appState.moveSetlistMedia(id, index);
    updateUISetlist();
  } catch (e) {
    if (e instanceof Error) alertMessageBox(e.message);
  }
})

ipcMain.on("delete-media", (_event, id: number) => {
  try {
    appState.deleteMedia(id);
    updateUISetlist();
    updateUIOpenMedia(); // !!
  } catch (e) {
    if (e instanceof Error) alertMessageBox(e.message);
  }
});

/* ------- */

ipcMain.on("set-open-media", (_event, id: number | null) => {
  try {
    appState.setOpenMedia(id);
    updateUIOpenMedia();
  } catch (e) {
    if (e instanceof Error) alertMessageBox(e.message);
  }
});

ipcMain.on("set-live-element", (_event, displayId: number, liveElementIdentifier: LiveElementIdentifier | null) => {
  try {
    appState.setLiveElement(displayId, liveElementIdentifier);
    updateUILiveElements();
    updateDisplayLiveElement(displayId);
  } catch (e) {
    if (e instanceof Error) alertMessageBox(e.message);
  }
})


app.on("ready", () => {
  protocol.handle('fetch-media', (request) => {
    const requestContent = decodeURIComponent(request.url.replace('fetch-media://', ''));
    let fileUrl: string;
    try {
      fileUrl = pathToFileURL(
        appState.media.get(parseInt(requestContent))!.value.path
      ).toString();
    } catch (e) {
      if (e instanceof Error) alertMessageBox(
        `Error handling ${request.url}: ${e.message}`
      );
      fileUrl = "";
    }
    console.log("local-file: fileUrl = ", fileUrl.toString());
    return net.fetch(fileUrl);
  });

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
    uiWindow.loadFile(path.join(app.getAppPath(), "/dist-ui/index.html"));
  }
});


app.whenReady().then(() => {
});

app.on("window-all-closed", () => {
  app.quit();
});


