import express from "express";
import path from "path";
import { AppState } from "./AppState.js";
import { app } from "electron";

function initExpressApp(appState: AppState) {
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
  expressApp.use("/mobile", express.static(path.join(app.getAppPath(), "/dist-mobile-ui")));
  expressApp.use(express.static(path.join(app.getAppPath(), "/dist-display")));
  return expressApp;
}

export { initExpressApp }
