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
import { registerConfigHandlers } from "./handlers/configHandlers.js";
import { WindowManager } from "./WindowManager.js";
import { FILTERS, matchFilter } from "./filters.js";
import { registerMediaHandlers } from "./handlers/mediaHandlers.js";
import { registerServerHandlers } from "./handlers/serverHandlers.js";
import { registerLiveHandlers } from "./handlers/liveHandlers.js";
import { registerUIHandlers } from "./handlers/uiHandlers.js";
import { registerMiscHandlers } from "./handlers/miscHandlers.js";
import { registerDisplayHandlers } from "./handlers/displayHandlers.js";

// handling unhandled rejected promises
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection in main process:', error);
  // Show dialog to user instead of crashing
  dialog.showErrorBox('Error', error.message);
});

let hasConfirmedUiWindowClose: boolean = false;

async function main() {
  const appState = new AppState();
  const ipcws = new IpcWs(
    ["ui-state-request", "ui-display-config-request", "alert", "set-logo", "set-open-media", "set-live-element"],
    ["invoke-display-get-init-live-state"]
  );

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

  const windowManager = new WindowManager(ipcws);

  const serverManager = new ServerManager(initExpressApp(appState), ipcws);

  serverManager.updatePortCallback = updatePort;

  function updatePort(port: number | null) {
    windowManager.sendToUIWindow("ui-update-port", appState.getPort());
    appState.setPort(port);
  }

  await serverManager.start();

  app.on("window-all-closed", async () => {
    console.log("stopping servers...");
    await serverManager.stop();
    console.log("quitting...");
    app.quit();
  });


  registerConfigHandlers(appState, windowManager);
  registerServerHandlers(appState, windowManager, serverManager);
  registerMediaHandlers(appState, windowManager);
  registerLiveHandlers(appState, windowManager);
  registerUIHandlers(appState, windowManager);
  registerDisplayHandlers(appState, windowManager, ipcws);
  registerMiscHandlers(appState, windowManager);

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

  // FIXME: transcendental security risk
  protocol.handle('local-file', request => {
    const pathToMedia = new URL(request.url).pathname
    return net.fetch(`file://${pathToMedia}`)
  });

  windowManager.createUiWindow();
}

app.on("ready", main);
