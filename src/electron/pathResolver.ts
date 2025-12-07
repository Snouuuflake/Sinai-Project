import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

function getPreloadPath(): string {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "dist-electron/preload.cjs",
  );
}

function getConfigPath(): string {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "config.json",
  );
}

export {getConfigPath, getPreloadPath}
