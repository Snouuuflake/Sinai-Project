import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron";
import { DISPLAYS } from "../shared/constants.js";
import { pathToFileURL } from "url";
import path from "path";
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
  MediaSong,
  Song,
} from "../shared/media-classes.js";
import { ConfigTypesKey, MainDisplayConfigEntry } from "../shared/config-classes.js";
import * as fs from "fs";
import { parseSong, logSong, stringifySong } from "./parser.js";
import Main from "electron/main";

// handling unhandled rejected promises
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection in main process:', error);
  // Show dialog to user instead of crashing
  dialog.showErrorBox('Error', error.message);
});

// FIXME: handle files by serving their b64 contents- 
// browser caches images such that opening a new image
// with the same name and path as one already loaded
// shows the old image
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

/**
 * Class that stores all of the state for the app.
 * Stores things like open files (media), the
 * order the user has them in (setlist), what
 * media's controls are being shown (openMedia),
 * what is being projected (liveElements), etc.
 * Has methods for updating this data safely (not
 * updating when invalid data is sent). Does not
 * send IPC state update messages (so as to not
 * have to define this class after the main window
 * is created or have it reference a global
 * variable).
 */
class AppState {
  // order (by id) of media in the UIWindow setlist
  #setlist: number[] = [];
  // set of all media (files, songs, images, etc) loaded by the user
  #media: Map<number, Media> = new Map();
  // for generating unique id's for each media loaded
  #mediaIdCounter: number = 0;
  // id of media being viewed in main UI window controls
  #openMedia: number | null = null;
  // elements being projected
  #liveElements: Array<LiveElementIdentifier | null> = Array.from({ length: DISPLAYS }, (_x) => null);
  constructor() {
  }
  // INFO: dc ------------------------------
  #dc: MainDisplayConfigEntry<ConfigTypesKey>[] = [];
  #findAssertNewDcEntryId(id: string) {
    const findRes = this.#dc.find(x => x.id === id);
    if (!findRes)
      throw new Error("getSerializedDcEntry: invalid id");
    return findRes;
  }
  addDcEntry(entry: MainDisplayConfigEntry<ConfigTypesKey>) {
    const findRes = this.#dc.find(x => x.id === entry.id);
    if (findRes)
      throw new Error("addDcEntry: id already exists");
    this.#dc.push(entry);
  }
  updateDcEntry(id: string, index: number, value: unknown) {
    this.#findAssertNewDcEntryId(id).setCurEntry(index, value);
  }
  resetDcEntry(id: string, index: number) {
    this.#findAssertNewDcEntryId(id).reinitEntry(index);
  }
  getSerializedDc() {
    return this.#dc.map(x => x.toSerialized());
  }
  // returns copy of this.#media
  get media(): Map<number, Media> {
    return new Map(this.#media);
  }
  // returns setlist as serializable media identiers (no value) for sending to ui browser window
  getUIStateSetlist(): SerializedMediaIdentifier[] {
    return this.#setlist.map(id => this.#media.get(id)!.toSerializedMediaIdentifier(id));
  }
  // returns openMedia as serializable media for sending to ui browser window
  getUIStateOpenMedia(): SerializedMediaWithId | null {
    if (this.#openMedia === null) return null;
    return this.#media.get(this.#openMedia)!
      .toSerializedMediaWithId(this.#openMedia);
  }
  // returns copy of live elements (already serializable)
  getUIStateLiveElements(): Array<LiveElementIdentifier | null> {
    return [...this.#liveElements];
  }
  // returns liveElements as serializable live elements for projection in display windows
  // handles undefined array item by just sending null (which is valid, means project nothing)
  getDisplayStateLiveElement(displayId: number): SerializedLiveElement | null {
    const le = this.#liveElements[displayId] ?? null;
    if (le === null) return null;
    return this.#media.get(le.id)?.toSerializedLiveElement(le.id, le.element) ?? null;
  }
  /**
    * sets song of media song in media
    * song is maybe the only media that will be edited by the user
    * @throws if id doesn't exist or is not MediaSong
    */
  setSongMediaSong(id: number, song: Song) {
    const targetMedia = this.#media.get(id);
    if (targetMedia === undefined) {
      throw new Error("setSongMediaSong: invalid id")
    }
    if (!(targetMedia instanceof MediaSong)) {
      throw new Error("setSongMediaSong: targetMedia not instance of MediaSong")
    }
    targetMedia.value.song = song;
    targetMedia.name = song.properties.title;
  }
  /**
   * sets openMedia
   * @throws if id not in media
   */
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
   * @throws if invalid display index or live element id invalid
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
   * @throws throws if id not in setlist or media or if invalid index
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
   * @throws throws if id not in setlist or in media
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

const appState = new AppState();

appState.addDcEntry(new MainDisplayConfigEntry("background-color", "hexcolor", "#000000"));
appState.addDcEntry(new MainDisplayConfigEntry("font-size", "nnumber", 30));
appState.addDcEntry(new MainDisplayConfigEntry("bold", "boolean", false));
appState.addDcEntry(new MainDisplayConfigEntry("text-color", "hexcolor", "#FFFFFF"));

function updateUIDisplayConfig() {
  sendToUIWindow("ui-update-display-config",
    appState.getSerializedDc()
  )
  sendToDisplayWinows("ui-update-display-config",
    appState.getSerializedDc()
  )
}
// FIXME: tmp
ipcMain.on("ui-display-config-request", (_event) => {
  updateUIDisplayConfig();
});
ipcMain.on("ui-set-display-config-entry", (_event, id, index, value) => {
  try {
    appState.updateDcEntry(id, index, value);
    updateUIDisplayConfig();
  } catch (err) {
    if (err instanceof Error) {
      alertMessageBox(err.message);
    }
  }
});
ipcMain.on("ui-reset-display-config-entry", (_event, id, index) => {
  try {
    appState.resetDcEntry(id, index);
    updateUIDisplayConfig();
  } catch (err) {
    if (err instanceof Error) {
      alertMessageBox(err.message);
    }
  }
});

/**
 * creates a display window and pushes it to displayWindows
 */
function createDisplayWindow(displayId: number) {
  const displayWindow = new BrowserWindow({
    title: `Sinai Project: Display Window ${displayId + 1}`,
    webPreferences: {
      preload: path.join(app.getAppPath(),
        isDev() ? "" : "..",
        "dist-electron/electron/preload.cjs"
      ),
    },
  });

  displayWindow.setMenu(null);

  displayWindow.on("close", () => {
    displayWindows.splice(displayWindows.indexOf(displayWindow), 1);
  })

  if (isDev()) {
    displayWindow.loadURL(`http://localhost:5124?displayId=${displayId}`);
    displayWindow.webContents.openDevTools();
  } else {
    displayWindow.loadFile(
      path.join(app.getAppPath(), "/dist-display/index.html"),
      { query: { displayId: displayId.toString() } }
    );
    displayWindow.webContents.openDevTools();
  }

  displayWindows.push(displayWindow);
  return displayWindow;
}



/* ------- ui ipc ------- */
function alertMessageBox(message: string) {
  if (uiWindow)
    dialog.showMessageBox(uiWindow, { message: message, });
}

ipcMain.on("new-display-window", (_event, id: number) => {
  createDisplayWindow(id);
});

ipcMain.on("alert", (_event, message: string) => {
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
      result.filePaths.forEach(fp =>
        appState.addMedia(
          new MediaImage(fp.split(path.sep).at(-1) ?? "Image", fp)
        )
      );
      updateUISetlist();
    }
  )
});

ipcMain.on("add-songs", (_event) => {
  if (!uiWindow)
    return;
  dialog.showOpenDialog(uiWindow, {
    title: "Add Media Songs",
    filters: [
      {
        name: "Songs", extensions: ["sinai", "txt", "mss"]
      }
    ],
    properties: ["openFile", "multiSelections"]
  }).then(
    result => {
      if (result.canceled) return;
      Promise.allSettled(
        result.filePaths.map<Promise<void>>(fp => {
          return new Promise<void>((resolve, reject) => {
            fs.readFile(fp, "utf8",
              (err, data) => {
                if (err) {
                  alertMessageBox(err.message);
                  reject();
                } else {
                  try {
                    const song = parseSong(data);
                    logSong(song);
                    appState.addMedia(
                      new MediaSong(
                        song.properties.title, song
                      )
                    );
                  } catch (e) {
                    if (e instanceof Error) {
                      alertMessageBox(`Error parsing song at:\n${fp}\n${e.message}`);
                    }
                    reject();
                  }
                  resolve();
                }
              }
            );
          })
        })).then(_results => { updateUISetlist() });
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

ipcMain.on("create-song", (_event, title: string, author: string) => {
  appState.addMedia(new MediaSong(title, {
    properties: {
      title: title,
      author: author,
    },
    sections: [],
    elementOrder: []
  }));
  updateUISetlist();
  updateUIOpenMedia(); // !!
})

ipcMain.on("replace-song", (_event, id: number, song: Song) => {
  try {
    appState.setSongMediaSong(id, song);
  } catch (e) {
    if (e instanceof Error)
      alertMessageBox(`Error replacing song: {id} {song.properties.title}\n{err.message}`);
  }
  updateUIOpenMedia();
  updateUISetlist();
});

ipcMain.on("save-song", (_event, id: number) => {
  const media = appState.media.get(id);
  if (media?.type !== "song")
    return;
  dialog.showSaveDialog(uiWindow, {
    title: "Save song",
    filters: [
      {
        name: "Sinai Project Song",
        extensions: ["sinai"]
      }
    ]
  }).then(result => {
    if (result.canceled)
      return;
    try {
      fs.writeFile(result.filePath, stringifySong(media.value.song), err => {
        if (err) {
          alertMessageBox(`Error saving song: {media.id} {media.name}\n{err.message}`);
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        alertMessageBox(`Error saving song: {media.id} {media.name}\n{err.message}`);
      }
    }
  });
});

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
    title: `Sinai Project`,
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
    uiWindow.webContents.openDevTools();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});


