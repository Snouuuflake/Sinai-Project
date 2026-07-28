import express from "express";
import path from "path";
import { AppState } from "./AppState.js";
import { app } from "electron";

function initExpressApp(appState: AppState) {
  const expressApp = express();
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
  expressApp.use(express.static(path.join(app.getAppPath(), "/dist-display")));
  return expressApp;
}

export { initExpressApp }
