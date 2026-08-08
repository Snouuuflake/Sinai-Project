import express from "express";
import path from "path";
import { AppState } from "./AppState.js";
import { app, ipcMain } from "electron";
import { LiveElementIdentifier } from "../shared/media-classes.js";
import { DISPLAYS } from "../shared/constants.js";

function initExpressApp(appState: AppState) {
  const expressApp = express();

  expressApp.get("/next-open-media/", (req, res) => {
    res.status(200).end();
    console.log("expressApp: GET /next-open-media/");
    ipcMain.emit("next-open-media");
  });
  expressApp.get("/prev-open-media/", (req, res) => {
    res.status(200).end();
    console.log("expressApp: GET /prev-open-media/");
    ipcMain.emit("prev-open-media");
  });
  expressApp.get("/next-selected-element/", (req, res) => {
    res.status(200).end();
    console.log("expressApp: GET /next-selected-element/");
    ipcMain.emit("next-selected-element");
  });
  expressApp.get("/prev-selected-element/", (req, res) => {
    res.status(200).end();
    console.log("expressApp: GET /prev-selected-element/");
    ipcMain.emit("prev-selected-element");
  });
  expressApp.get("/toggle-logo-to-all/", (req, res) => {
    /*
     * if any !logo, sets logo to true for all, else, false
     */
    res.status(200).end();
    console.log(`expressApp: GET /toggle-logo-to-all/`);
    if (appState.getLogo().every(x => x)) {
      for (let i = 0; i < DISPLAYS; i++) {
        ipcMain.emit("set-logo", {}, i, false);
      }
    } else {
      for (let i = 0; i < DISPLAYS; i++) {
        ipcMain.emit("set-logo", {}, i, true);
      }
    }

  });
  expressApp.get("/project-selected-element-to-all/", (req, res) => {
    res.status(200).end();
    console.log(`expressApp: GET /project-selected-element-to-all/`);

    const lei: LiveElementIdentifier | null = appState.openMedia === null ?
      null :
      appState.selectedLiveElementId === null ?
        null :
        {
          id: appState.openMedia,
          element: appState.selectedLiveElementId,
        }
    console.log("DEBUG! lei:", lei);
    for (let i = 0; i < DISPLAYS; i++) {
      ipcMain.emit("set-live-element", {}, i, lei);
    }
  });

  expressApp.get("/fetch-setlist-media/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const media = appState.setlistMedia.get(id);
    console.log("fetch-media", id, media?.value);
    if (!media || media.type !== "image") {
      console.log("404ing")
      res.status(404).end();
      return;
    }
    res.sendFile(media.value.path);
  });

  expressApp.get("/fetch-extra-media/:id", (req, res) => {
    const id = req.params.id;
    const media = appState.extraMedia.get(id);
    console.log("fetch-media", id, media?.value);
    if (!media || media.type !== "image") {
      console.log("404ing")
      res.status(404).end();
      return;
    }
    res.sendFile(
      media.value.path,
      // {
      //   cacheControl: false, // stop `send` from setting its own Cache-Control/maxAge
      //   lastModified: false, // stop it from setting Last-Modified (used for conditional caching)
      //   etag: false,          // stop it from setting an ETag (also used for conditional caching)
      //   headers: {
      //     "Cache-Control": "no-store, no-cache, must-revalidate",
      //     "Pragma": "no-cache",
      //     "Expires": "0",
      //   }
      // },
      err => {
        if (err) {
          console.log("express: fetch-local-media - sendFile error", err);
          if (!res.headersSent) res.status(500).end();
        }
      }
    );
  });
  expressApp.get("/local-file/:path", (req, res) => {
    const path = decodeURIComponent(req.params.path);
    console.log("local-file", path);
    res.sendFile(path);
  });
  expressApp.use("/mobile", express.static(path.join(app.getAppPath(), "/dist-mobile-ui")));
  expressApp.use("/simple-http-controls", express.static(path.join(app.getAppPath(), "/dist-simple-http-controls")));
  expressApp.use(express.static(path.join(app.getAppPath(), "/dist-display")));
  return expressApp;
}

export { initExpressApp }
