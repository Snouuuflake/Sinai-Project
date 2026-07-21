import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron";
import { pathToFileURL } from "url";
import path from "path";
import * as fs from "fs";
import express from "express";
import { AddressInfo, WebSocketServer } from "ws";
import http from "http";
import { initExpressApp } from "./express.js";


import { isDev } from "./util.js";
import { getConfigPath, getPreloadPath } from "./pathResolver.js";
import { DISPLAYS } from "../shared/constants.js";
import {
  LiveElementIdentifier,
  MediaImage,
  MediaSong,
  Song,
  SerializedLiveState,
  Media,
} from "../shared/media-classes.js";

import { parseSong, logSong, stringifySong } from "./parser.js";

import { AppState, MainDisplayConfigEntry, MainGeneralConfigEntry } from "./AppState.js";

import { IpcWs } from "./IpcWs.js";
import { ServerManager } from "./ServerManager.js";
import { addConfigEntries } from "./appState-config.js";


const FILTERS = {
  "Images": {
    name: "Images",
    extensions: [
      "apng", "gif", "ico", "cur", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg",
    ]
  },
  "Songs": {
    name: "Songs",
    extensions: [
      "sinai", "txt", "mss"
    ]
  }
} as const;

function matchFilter(str: string, filter: keyof typeof FILTERS): boolean {
  const regexp = new RegExp("\." + (FILTERS[filter].extensions.join("|")) + "$");
  return !!str.match(regexp);
}

// handling unhandled rejected promises
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection in main process:', error);
  // Show dialog to user instead of crashing
  dialog.showErrorBox('Error', error.message);
});


const appState = new AppState();
const ipcws = new IpcWs(
  ["ui-state-request", "ui-display-config-request", "alert", "set-logo", "set-open-media", "set-live-element"],
  ["invoke-display-get-init-live-state"]
);
const serverManager = new ServerManager(initExpressApp(appState), ipcws);


addConfigEntries(appState);
// attempt to read config file
if (fs.existsSync(getConfigPath())) {
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
    if (err instanceof Error) { dialog.showErrorBox("Error", err.message) }
  }
}

let uiWindow: BrowserWindow;
const displayWindows: BrowserWindow[] = []


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


function updateUIPort() {
  sendToUIWindow("ui-update-port", appState.getPort());
}

function updatePort(port: number | null) {
  appState.setPort(port);
  updateUIPort();
}

ipcMain.on("ui-port-request", (_event) => {
  updateUIPort();
})

ipcMain.on("ui-restart-server-request", (_event) => {
  serverManager.start();
})

ipcMain.on("ui-open-devtools", (_event) => {
  if (uiWindow)
    uiWindow.webContents.openDevTools();
})



function updateDisplayConfig() {
  sendToUIWindow("ui-update-display-config",
    appState.getSerializedDc()
  )
  sendToDisplayWindows("display-update-display-config",
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

ipcMain.on("new-display-window", (_event, id: number) => {
  createDisplayWindow(id);
});

ipcMain.on("alert", (_event, message: string) => {
  dialog.showErrorBox("Error", message);
});

function sendToUIWindow(channel: string, ...args: any[]) {
  if (!uiWindow) return;
  uiWindow.webContents.send(channel, ...args);
  ipcws.broadcastToWsClients(channel, ...args);
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
  sendToUIWindow("ui-state-update-logo", appState.getLogo());
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
ipcws.handle("invoke-display-get-init-live-state", (displayIndex): SerializedLiveState => {
  return {
    liveElement: appState.getDisplayStateLiveElement(displayIndex),
    logo: appState.getLogoEntry(displayIndex),
  }
})

/* on setlist operations */

function readImage(filePath: string): Promise<void | Error> {
  return new Promise<void>(
    (resolve, _reject) => {
      appState.addMedia(
        new MediaImage(filePath.split(path.sep).at(-1) ?? "Image", filePath)
      );
      resolve();
    }
  );
}

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
      result.filePaths.forEach(readImage);
      updateUISetlist();
    }
  )
});

function readSong(filePath: string): Promise<void | Error> {
  return new Promise<void>(
    (resolve, reject) => {
      fs.readFile(filePath, "utf8",
        (err, data) => {
          if (err) {
            console.error(`Error reading song at:\n${filePath}\n${err.message}`);
            reject(new Error(`Error reading song at: ${path.basename(filePath)}`));
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
                console.error(`Error parsing song at:\n${filePath}\n${e.message}`);
                reject(new Error(`Error parsing song at: ${path.basename(filePath)}. ${e.message}`));
              }
            }
            resolve();
          }
        }
      );
    }
  )
}

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
        result.filePaths.map<Promise<void | Error>>(readSong)
      ).then(
        results => {
          const errors = results.filter(
            result => result.status === "rejected"
          );
          if (errors.length > 0)
            dialog.showErrorBox(
              "Error",
              errors.map(result => `${result.reason}`).join("\n")
            );
          updateUISetlist();
        }
      );
    }
  )
});

ipcMain.on(
  "read-directory",
  (_event) => {
    if (!uiWindow)
      return;
    dialog.showOpenDialog(uiWindow, {
      title: "Read Folder",
      filters: [],
      properties: ["openDirectory"]
    }).then(
      result => {
        if (result.canceled) return;
        fs.readdir(
          result.filePaths[0],
          async (err, files) => {
            if (err) {
              dialog.showErrorBox("Error", `Error reading folder: ${err.message}`);
              return;
            }
            const filePaths = files.map(file => path.resolve(result.filePaths[0], file)).filter(fp => fs.statSync(fp).isFile()).sort();
            const errors: Error[] = [];

            for (const fp of filePaths) {
              try {
                if (matchFilter(fp, "Songs")) {
                  await readSong(fp);
                }
                else if (matchFilter(fp, "Images")) {
                  await readImage(fp);
                }
              } catch (err) {
                if (err instanceof Error)
                  errors.push(err);
              }
            }

            if (errors.length > 0)
              dialog.showErrorBox("Error", "Errores leyendo setlist: \n" + errors.map(err => err.message).join("\n"));

            updateUISetlist();
          }
        );
      }
    )
  }
);



ipcMain.on(
  "write-setlist",
  (_event) => {
    if (!uiWindow)
      return;
    dialog.showSaveDialog(uiWindow, {
      title: "Guardar Setlist",
      buttonLabel: "Guardar",
      filters: [],
      properties: ["createDirectory"]
    }).then(
      async result => {
        if (result.canceled) return;

        try {
          fs.mkdirSync(result.filePath, { recursive: true })
        } catch (err) {
          if (err instanceof Error)
            dialog.showErrorBox("Error", "Error writing setlist" + " " + err.message);
          return;
        }

        const errors: Error[] = [];
        const setlistLengthDigits = Math.ceil(Math.log10(appState.getUIStateSetlist().length + 1));
        const setlistDebugName = result.filePath.slice(-30);
        appState.getUIStateSetlist().forEach(
          (smi, i) => {
            const filePrefix = "sp_" + (i).toString().padStart(
              setlistLengthDigits, "0"
            ) + "_"

            try {
              let media: Media | undefined = undefined;
              switch (smi.type) {
                case "song":
                  media = appState.media.get(smi.id);
                  if (media instanceof MediaSong) {
                    const fileName = path.join(result.filePath, filePrefix + media.name + ".sinai",)
                    writeSong(
                      fileName,
                      media
                    );
                    console.log(`wrote song ${fileName} to setlist ${setlistDebugName}`);
                  } else {
                    throw new Error(`Somehow was unable to get() smi: ${smi} from  appState.media`);
                  }
                  break;
                case "image":
                  media = appState.media.get(smi.id);
                  if (media instanceof MediaImage) {
                    const basename = path.basename(media.value.path);
                    const replacedName = basename.replace(/^sp_\d+_/, "");
                    console.log(basename, replacedName);
                    const fileName = filePrefix + replacedName;

                    fs.copyFile(
                      media.value.path,
                      path.join(
                        result.filePath,
                        fileName,
                      ),
                      fs.constants.COPYFILE_FICLONE,
                      (err) => {
                        if (err) {
                          dialog.showErrorBox("Error", ` Error copying image ${(media as MediaImage).value.path.slice(-30)} to setlist ${setlistDebugName}: \n${err.message}`);
                        } else {
                          console.log(`wrote image ${fileName} to setlist ${setlistDebugName}`);
                        }
                      },
                    );
                  } else {
                    throw new Error(`Somehow was unable to get() smi: ${smi} from  appState.media`);
                  }
                  break;
                default:
                  break;
              }
            } catch (err) {
              if (err instanceof Error) {
                errors.push(new Error(`Error writing setlist item: ${err.message}`));
              }
            }
          }
        );
        if (errors.length > 0)
          dialog.showErrorBox("Error", errors.join("\n"));
      }
    );
  }
)

ipcMain.on("move-media", (_event, id: number, index: number) => {
  try {
    appState.moveSetlistMedia(id, index);
    updateUISetlist();
  } catch (e) {
    if (e instanceof Error) dialog.showErrorBox("Error", e.message);
  }
})

ipcMain.on("delete-media", (_event, id: number) => {
  let mediaToDelete = appState.media.get(id);
  if (mediaToDelete === undefined)
    throw new Error("delete-media: media id doesn't exist");
  dialog.showMessageBox(uiWindow, {
    message: `¿Está seguro que desea eliminar ${mediaToDelete.name}?\n\n Esta acción es irreversible.`,
    buttons: ["Ok", "Cancel"],
    defaultId: 1,
    cancelId: 1,
  }).then(value => {
    if (value.response === 0) {
      try {
        appState.deleteMedia(id);
        updateUISetlist();
        updateUIOpenMedia(); // !!
      } catch (e) {
        if (e instanceof Error) dialog.showErrorBox("Error", e.message);
      }
    }
  })
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
      dialog.showErrorBox("Error", `Error replacing song: {id} {song.properties.title}\n{err.message}`);
  }
  updateUIOpenMedia();
  updateUISetlist();
});

function writeSong(filePath: string, media: MediaSong) {
  try {
    fs.writeFile(filePath, stringifySong(media.value.song), err => {
      if (err) {
        dialog.showErrorBox("Error", `Error saving song: {media.id} {media.name}\n{err.message}`);
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      dialog.showErrorBox("Error", `Error saving song: {media.id} {media.name}\n{err.message}`);
    }
  }
}

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
    writeSong(result.filePath, media as MediaSong);
  });
});

ipcMain.on("set-open-media", (_event, id: number | null) => {
  try {
    appState.setOpenMedia(id);
    updateUIOpenMedia();
  } catch (e) {
    if (e instanceof Error) dialog.showErrorBox("Error", e.message);
  }
});

ipcMain.on("set-live-element", (_event, displayId: number, liveElementIdentifier: LiveElementIdentifier | null) => {
  try {
    appState.setLiveElement(displayId, liveElementIdentifier);
    updateUILiveElements();
    updateDisplayLiveElement(displayId);
  } catch (e) {
    if (e instanceof Error) dialog.showErrorBox("Error", e.message);
  }
})

ipcMain.on("set-logo", (_event, displayIndex: number, logo: boolean) => {
  try {
    appState.setLogo(displayIndex, logo);
    updateUILogo();
    updateDisplayLogo(displayIndex);
  } catch (e) {
    if (e instanceof Error) dialog.showErrorBox("Error", e.message);
  }
});

let hasConfirmedUiWindowClose: boolean = false;

async function main() {
  serverManager.updatePortCallback = updatePort;
  await serverManager.start();

  protocol.handle('fetch-media', (request) => {
    const requestContent = decodeURIComponent(request.url.replace('fetch-media://', ''));
    let fileUrl: string;
    try {
      fileUrl = pathToFileURL(
        appState.media.get(parseInt(requestContent))!.value.path
      ).toString();
    } catch (e) {
      if (e instanceof Error)
        dialog.showErrorBox("Error", `Error handling ${request.url}: ${e.message}`);
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
  }
}

app.on("ready", main);

app.on("window-all-closed", async () => {
  await serverManager.stop();
  app.quit();
});

