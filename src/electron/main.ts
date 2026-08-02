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

import { ALLOWED_DISPLAY_INVOKE_CHANNELS, ALLOWED_DISPLAY_SEND_CHANNELS } from "./electron-constants.js";

// handling unhandled rejected promises
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection in main process:', error);
  // Show dialog to user instead of crashing
  dialog.showErrorBox('Error', error.message);
});

async function main() {
  const appState = new AppState();

  const ipcws = new IpcWs(
    ALLOWED_DISPLAY_SEND_CHANNELS,
    ALLOWED_DISPLAY_INVOKE_CHANNELS,
  );

  const windowManager = new WindowManager(ipcws);

  const serverManager = new ServerManager(initExpressApp(appState), ipcws);

  addConfigEntries(appState, serverManager);

  function updatePort(port: number | null) {
    // appState.setPort(port);
    windowManager.sendToUIWindow("ui-update-port", serverManager.port);
  }

  serverManager.updatePortCallback = updatePort;

  registerConfigHandlers(appState, windowManager, serverManager);
  registerServerHandlers(appState, windowManager, serverManager);
  registerMediaHandlers(appState, windowManager);
  registerLiveHandlers(appState, windowManager);
  registerUIHandlers(appState, windowManager);
  registerDisplayHandlers(appState, windowManager, ipcws);
  registerMiscHandlers(appState, windowManager);

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

  protocol.handle('fetch-setlist-media', (request) => {
    const requestContent = decodeURIComponent(request.url.replace('fetch-setlist-media://', ''));
    let fileUrl: string;
    try {
      console.log(`trying to fetch setlist media - requestContent: ${requestContent}`);
      fileUrl = pathToFileURL(
        appState.setlistMedia.get(parseInt(requestContent))!.value.path
      ).toString();
    } catch (e) {
      if (e instanceof Error)
        dialog.showErrorBox("Error", `Error handling ${request.url}: ${e.message}`);
      fileUrl = "";
    }
    return net.fetch(fileUrl);
  });

  protocol.handle('fetch-extra-media', async (request) => {
    const requestContent = decodeURIComponent(request.url.replace('fetch-extra-media://', '').replace(/\?.*/, ""));
    let fileUrl: string;
    try {
      console.log(`trying to fetch extra media - requestContent: ${requestContent}`);
      appState.extraMedia.forEach((a, b) => console.log(a, b));
      fileUrl = pathToFileURL(
        appState.extraMedia.get(requestContent)!.value.path
      ).toString();
    } catch (e) {
      if (e instanceof Error)
        dialog.showErrorBox("Error", `Error handling ${request.url}: ${e.message}`);
      fileUrl = "";
    }

    const response = await net.fetch(fileUrl);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      // headers,
    });
  });

  app.on("window-all-closed", async () => {
    console.log("stopping servers...");
    await serverManager.stop();
    console.log("quitting...");
    app.quit();
  });


  windowManager.createUiWindow();
}

app.on("ready", main);
