import { app, protocol, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getConfigPath, getPreloadPath } from "./pathResolver.js";
import { readMSSFile, writeMSSFile } from "./parser.js";
import * as fs from "fs";

// class DisplayWindow {
//   index: number;
//   window: BrowserWindow;
//
//   constructor(index: number) {
//     this.index = index;
//     this.window = new BrowserWindow({
//       minWidth: 400,
//       webPreferences: {
//         preload: getPreloadPath(),
//         additionalArguments: [`${index}`],
//       },
//     });
//
//     this.window.setMenuBarVisibility(false);
//
//     this.window.on("close", () => {
//       windowArray.splice(windowArray.indexOf(this), 1);
//       console.log(windowArray);
//     });
//
//     windowArray.push(this);
//
//     this.window.loadFile(
//       path.join(app.getAppPath(), "/dist-display/index.html"),
//     );
//     console.log(windowArray);
//   }
// }

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    minWidth: 500,
    minHeight: 500,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  mainWindow.setMenu(null);
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("_alert", (_event, message: string) => {
  dialog.showMessageBox({ message: message });
});

