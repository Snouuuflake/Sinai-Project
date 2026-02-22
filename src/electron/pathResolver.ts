import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

function getPreloadPath(): string {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "dist-electron/electron/preload.cjs",
  );
}

function getConfigPath(): string {
  if (isDev()) {
    return path.join(
      app.getAppPath(),
      "./config.json"
    );
  }
  else {

    return path.join(
      process.resourcesPath,
      "extraResources"
    );
  }
}

export { getConfigPath, getPreloadPath }
