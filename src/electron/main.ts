import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron";
import { DISPLAYS } from "../shared/constants.js";
import { pathToFileURL } from "url";
import path from "path";
import { isDev } from "./util.js";
import { getConfigPath, getPreloadPath } from "./pathResolver.js";
import {
  LiveElementIdentifier,
  MediaImage,
  MediaSong,
  Song,
  SerializedLiveState,
} from "../shared/media-classes.js";
import * as fs from "fs";
import { parseSong, logSong, stringifySong } from "./parser.js";
import { AppState, MainDisplayConfigEntry, MainGeneralConfigEntry } from "./AppState.js";
import { IpcWs } from "./IpcWs.js";

import express from "express";
import { Express } from "express";
import { AddressInfo, WebSocketServer } from "ws";
import http from "http";

const FILTERS = {
  "Images": {
    name: "Images",
    extensions: [
      "apng", "gif", "ico", "cur", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg",
    ]
  },
  "Songs": {
    name: "Songs",
    extensions: ["sinai", "txt", "mss"]
  }
} as const;

// handling unhandled rejected promises
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection in main process:', error);
  // Show dialog to user instead of crashing
  dialog.showErrorBox('Error', error.message);
});

function alertMessageBox(message: string) {
  if (uiWindow)
    dialog.showMessageBox(uiWindow, { message: message, });
}

// FIXME: handle files by serving their b64 contents- 
// browser caches images such that opening a new image
// with the same name and path as one already loaded
// shows the old image
// *maybe
// protocol.registerSchemesAsPrivileged([
//   {
//     scheme: 'local-file',
//     privileges: {
//       // standard: true,
//       secure: true,
//       supportFetchAPI: true,
//       // corsEnabled: false,
//       bypassCSP: false,
//       stream: true
//     }
//   },
//
//   {
//     scheme: 'media',
//     privileges: {
//       secure: true,
//       supportFetchAPI: true,
//       bypassCSP: false,
//       stream: true
//     }
//   }
// ]);

const expressApp = express();
expressApp.get("/fetch-media/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const media = appState.media.get(id);
  console.log("fetch-media", id, media?.value);
  if (!media || media.type !== "image") {
    console.log("404ing")
    res.status(404).end();
    return;
  }
  res.sendFile(media.value.path);
});
expressApp.get("/local-file/:path", (req, res) => {
  const path = decodeURIComponent(req.params.path);
  console.log("local-file", path);
  res.sendFile(path);
});
expressApp.use(express.static(path.join(app.getAppPath(), "/dist-display")));

const ipcws = new IpcWs();

let httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null = null;
function startServers() {
  // if (httpServer) {
  //   httpServer.close(console.error);
  // }
  httpServer = http.createServer(expressApp);
  const wss = new WebSocketServer({ server: httpServer });

  httpServer!.listen(0, () => {
    try {
      const port = (httpServer!.address() as AddressInfo).port; // e.g. 49823
      console.log(`!!!!!!!!!! listening on port: ${port}`);
      updatePort(port);
    } catch (err) {
      console.error(err);
    }
  });

  ipcws.initWss(wss);
}

function updateUIPort() {
  sendToUIWindow("ui-update-port", appState.getPort());
}

function updatePort(port: number | null) {
  appState.setPort(port);
  updateUIPort();
}




let uiWindow: BrowserWindow;
const displayWindows: BrowserWindow[] = []

const appState = new AppState();

// dc
//   general

appState.addDcEntry(new MainDisplayConfigEntry("background-color", "hexcolor", "#000000"));
appState.addDcEntry(new MainDisplayConfigEntry("background-image", "path", ""))

appState.addDcEntry(new MainDisplayConfigEntry("transition-duration", "nnumber", 300));

appState.addDcEntry(new MainDisplayConfigEntry("logo-path", "path", ""));
appState.addDcEntry(new MainDisplayConfigEntry("logo-size", "nnumber", 50));

//   text
appState.addDcEntry(new MainDisplayConfigEntry("font-size", "nnumber", 30));
appState.addDcEntry(new MainDisplayConfigEntry("font", "string", ""));
appState.addDcEntry(new MainDisplayConfigEntry("bold", "boolean", false));
appState.addDcEntry(new MainDisplayConfigEntry("text-color", "hexcolor", "#FFFFFF"));
appState.addDcEntry(new MainDisplayConfigEntry("text-outline-width", "nnumber", 0));
appState.addDcEntry(new MainDisplayConfigEntry("text-outline-color", "hexcolor", "#000000"));

appState.addDcEntry(new MainDisplayConfigEntry("text-margin-top", "nnumber", 0));
appState.addDcEntry(new MainDisplayConfigEntry("text-margin-bottom", "nnumber", 0));
appState.addDcEntry(new MainDisplayConfigEntry("text-margin-left", "nnumber", 0));
appState.addDcEntry(new MainDisplayConfigEntry("text-margin-right", "nnumber", 0));

appState.addDcEntry(new MainDisplayConfigEntry("text-background-color", "hexcolor", "#00000000"));

// gc
appState.addGcEntry(new MainGeneralConfigEntry("dark-theme", "boolean", false));


if (fs.existsSync(getConfigPath())) {
  // console.log(fs.readFileSync(getConfigPath(), { encoding: "utf8" }));
  appState.readConfigFile();
} else {
  try {
    fs.writeFileSync(
      getConfigPath(),
      JSON.stringify({
        dc: [],
        gc: []
      }),
      { encoding: "utf8" },
    );
  } catch (err) {
    if (err instanceof Error) { alertMessageBox(err.message) }
  }
}


/**
 * creates a display window and pushes it to displayWindows
 */
function createDisplayWindow(displayId: number) {
  const displayWindow = new BrowserWindow({
    title: `Sinai Project: Display Window ${displayId + 1}`,
    webPreferences: {
      preload: getPreloadPath("display"),
    },
  });

  displayWindow.setMenu(null);

  displayWindow.on("close", () => {
    displayWindows.splice(displayWindows.indexOf(displayWindow), 1);
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

  displayWindows.push(displayWindow);
  return displayWindow;
}


function updateDisplayConfig() {
  sendToUIWindow("ui-update-display-config",
    appState.getSerializedDc()
  )
  sendToDisplayWindows("display-update-display-config",
    appState.getSerializedDc()
  )
}
function imageDialog(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    dialog.showOpenDialog(uiWindow, {
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

ipcMain.on("ui-port-request", (_event) => {
  updateUIPort();
})

ipcMain.on("ui-restart-server-request", (_event) => {
  startServers();
})

ipcMain.on("ui-open-devtools", (_event) => {
  if (uiWindow)
    uiWindow.webContents.openDevTools();
})
ipcMain.on("ui-display-config-request", (_event) => {
  updateDisplayConfig();
});
ipcMain.on("ui-set-display-config-entry", (_event, id, index, value) => {
  try {
    appState.updateDcEntry(id, index, value);
    updateDisplayConfig();
  } catch (err) {
    if (err instanceof Error) {
      alertMessageBox(err.message);
    }
  }
});
ipcMain.on("ui-reset-display-config-entry", (_event, id, index) => {
  try {
    appState.resetDcEntry(id, index);
    updateDisplayConfig();
  } catch (err) {
    if (err instanceof Error) {
      alertMessageBox(err.message);
    }
  }
});

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
  sendToUIWindow("ui-update-general-config",
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
      alertMessageBox(err.message);
    }
  }
});
ipcMain.on("ui-reset-general-config-entry", (_event, id) => {
  try {
    appState.resetGcEntry(id);
    updateUIGeneralConfig();
  } catch (err) {
    if (err instanceof Error) {
      alertMessageBox(err.message);
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

/* ------- ui ipc ------- */

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

function updateUILogo() {
  sendToUIWindow("ui-state-update-logo", appState.getLogo())
}


function updateAllUI() {
  updateUISetlist();
  updateUIOpenMedia();
  updateUILiveElements();
  updateUILogo();
}

ipcMain.on("ui-state-request", (_event) => { updateAllUI(); });

/* ----- display ipc ----- */

function sendToDisplayWindows(channel: string, ...args: any[]) {
  displayWindows.forEach(dw => {
    if (dw)
      dw.webContents.send(channel, ...args);
  })
  ipcws.broadcastToWsClients(channel, ...args);
}

function updateDisplayLiveElement(displayIndex: number) {
  sendToDisplayWindows(
    "display-state-update-live-elements",
    displayIndex,
    appState.getDisplayStateLiveElement(displayIndex)
  );
}

function updateDisplayLogo(displayIndex: number) {
  sendToDisplayWindows(
    "display-state-update-logo",
    displayIndex,
    appState.getLogoEntry(displayIndex)
  )
}


// so that windows automatically start displaying upon creation
ipcws.handleIpcWs("invoke-display-get-init-live-state", (displayIndex): SerializedLiveState => {
  console.log("invoked thing", displayIndex);
  return {
    liveElement: appState.getDisplayStateLiveElement(displayIndex),
    logo: appState.getLogoEntry(displayIndex),
  }
})

// ipcMain.handle("invoke-display-get-init-live-state", (_e, displayIndex): SerializedLiveState => {
//   return {
//     liveElement: appState.getDisplayStateLiveElement(displayIndex),
//     logo: appState.getLogoEntry(displayIndex),
//   }
// })

/* on setlist operations */
ipcMain.on("add-images", (_event) => {
  if (!uiWindow)
    return;
  dialog.showOpenDialog(uiWindow, {
    title: "Add Media Images",
    filters: [
      FILTERS["Images"] as any
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
      FILTERS["Songs"] as any
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

ipcMain.on("set-logo", (_event, displayIndex: number, logo: boolean) => {
  try {
    appState.setLogo(displayIndex, logo);
    updateUILogo();
    updateDisplayLogo(displayIndex);
  } catch (e) {
    if (e instanceof Error) alertMessageBox(e.message);
  }
});

let hasConfirmedUiWindowClose: boolean = false;

app.on("ready", () => {
  startServers();

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
    return net.fetch(fileUrl);
  });

  protocol.handle('local-file', request => {
    const pathToMedia = new URL(request.url).pathname
    return net.fetch(`file://${pathToMedia}`)
  });

  uiWindow = new BrowserWindow({
    title: `Sinai Project`,
    minWidth: 500,
    minHeight: 500,
    webPreferences: {
      preload: getPreloadPath("ui"),
    },
  });
  uiWindow.setMenu(null);


  uiWindow.on("close", (event) => {
    if (!hasConfirmedUiWindowClose) {
      event.preventDefault();
      dialog.showMessageBox(uiWindow, {
        message: "Estás seguro que quieres cerrar Sinai Project?",
        type: "warning",
        buttons: ["Ok", "Cancel"],
        defaultId: 1,
        cancelId: 1,
      }).then(value => {
        if (value.response === 0) {
          hasConfirmedUiWindowClose = true;
          uiWindow.close();
          // FIXME: looks to do nothing
          // for (let i = 0; i < DISPLAYS; i++) {
          //   ipcMain.emit("set-live-element", i, null);
          // }
          app.quit();
        }
      })
    }
  })

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


export { alertMessageBox };
