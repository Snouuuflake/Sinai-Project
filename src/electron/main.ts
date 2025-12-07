import { app, protocol, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getConfigPath, getPreloadPath } from "./pathResolver.js";
import { readMSSFile, writeMSSFile } from "./parser.js";
//import { promises as fsp } from "fs";
import * as fs from "fs";

// TODO: make this one variable for electron and react
const MAX_LIVE_ELEMENTS = 4;

type CurrentLiveWindowValuesType = {
  logo: boolean;
  liveElements: LiveElementType[]
}

const currentLiveWindowValues: CurrentLiveWindowValuesType = {
  logo: false,
  liveElements: [],
}

let activeConfig: FullDisplayConfigType | null = null;

function handleJSONAsync(
  channel: string,
  callback: (obj: any) => Promise<any>,
) {
  ipcMain.handle(channel, async (_event, data) => {
    return JSON.stringify(await callback(JSON.parse(data)));
  });
}

const windowArray: Array<DisplayWindow> = [];

class DisplayWindow {
  index: number;
  window: BrowserWindow;

  constructor(index: number) {
    this.index = index;
    this.window = new BrowserWindow({
      minWidth: 400,
      webPreferences: {
        preload: getPreloadPath(),
        additionalArguments: [`${index}`],
      },
    });

    this.window.setMenuBarVisibility(false);

    this.window.on("close", () => {
      windowArray.splice(windowArray.indexOf(this), 1);
      console.log(windowArray);
    });

    windowArray.push(this);

    this.window.loadFile(
      path.join(app.getAppPath(), "/dist-display/index.html"),
    );
    console.log(windowArray);
  }
}

ipcMain.handle("invoke-index", (event) => {
  return new Promise<number>((resolve, reject) => {
    const senderWindow = windowArray.find(
      (element: DisplayWindow) =>
        element.window.webContents.id == event.sender.id,
    );
    if (senderWindow) {
      resolve(senderWindow.index);
    } else {
      reject("window doesnt exist ?¡??!?");
    }
  });
});

function sendToAllDisplayWindows(channel: string, data: any) {
  windowArray.forEach((w) => {
    w.window.webContents.send(channel, data);
  });
}

// INFO: IPC live element handling

const sendLiveElement = (index: number, liveElement: LiveElementType) => {
  switch (liveElement.type) {
    case "text":
      sendToAllDisplayWindows(`display-${index}-text`, liveElement.value);
      break;
    case "image":
      sendToAllDisplayWindows(`display-${index}-image`, liveElement.value);
      break;
    case "none":
      sendToAllDisplayWindows(`display-${index}-none`, undefined);
      break;
    default:
      break;
  }
};

ipcMain.on(
  "set-live-element",
  (_event, data: { index: number; liveElement: LiveElementType }) => {
    console.log(data);
    currentLiveWindowValues.liveElements[data.index] = data.liveElement;
    sendLiveElement(data.index, data.liveElement);
  },
);

ipcMain.on("get-live-element", (_event, index: number) => {
  if (currentLiveWindowValues.liveElements[index]) {
    sendLiveElement(index, currentLiveWindowValues.liveElements[index]);
  }
});

// INFO: IPC logo handling

ipcMain.on("set-logo", (_event, value) => {
  currentLiveWindowValues.logo = value;
  sendToAllDisplayWindows("display-logo", value);
});

ipcMain.handle("get-logo", (_event, _index: number) => {
  return currentLiveWindowValues.logo;
});

// INFO: horrible display settings

const updateDisplay = (og: DisplayConfigType, updater: DisplayConfigType) => {
  const updateDisplayField = (
    og: DisplayConfigEntryType[],
    updater: DisplayConfigEntryType[],
  ) => {
    console.log(updater);
    for (const entry of updater) {
      const found = og.find((x) => x.key === entry.key);
      if (found) {
        og[og.indexOf(found)] = entry;
      } else {
        og.push(entry);
      }
    }
  };
  og.forEach((dcs, i) => {
    updateDisplayField(dcs.entries, updater[i].entries);
  });
};

const readFullConfig = () => {
  const makeDefaultFullConfig = (): FullDisplayConfigType => {
    const makeDefaultConfig = (): DisplayConfigType => [
      {
        name: "Global",
        entries: [
          {
            key: "Logo Image",
            css: "background-image",
            special: "",
            type: "path",
            default: "",
            value: null,
            target: [".logo"],
          },
          {
            key: "Logo Scale",
            css: "background-size",
            special: "",
            type: "number",
            default: 50,
            unit: "%",
            value: null,
            target: [".logo"],
          },
          {
            key: "Background Color",
            css: "background-color",
            special: "",
            type: "csscolor",
            default: "black",
            value: null,
            target: [".global", ".logo"],
          },
          {
            key: "Background Image",
            css: "background-image",
            special: "",
            type: "path",
            default: "",
            value: null,
            target: [".global"],
          },
          {
            key: "Transition length (ms)",
            css: "--default-animation-length",
            type: "number",
            special: "",
            default: 0,
            value: null,
            unit: "",
            target: [":root"],
          },
        ],
      },
      {
        name: "Text",
        entries: [
          {
            key: "Margin Left",
            css: "margin-left",
            type: "number",
            unit: "vw",
            default: 0,
            value: null,
            target: [".text"],
            special: "",
          },
          {
            key: "Margin Right",
            css: "margin-right",
            type: "number",
            unit: "vw",
            default: 0,
            value: null,
            target: [".text"],
            special: "",
          },
          {
            key: "Margin Top",
            css: "margin-top",
            type: "number",
            unit: "vh",
            default: 0,
            value: null,
            target: [".text"],
            special: "",
          },
          {
            key: "Margin Bottom",
            css: "margin-bottom",
            type: "number",
            unit: "vh",
            default: 0,
            value: null,
            target: [".text"],
            special: "",
          },
          {
            key: "Font Size",
            css: "font-size",
            type: "number",
            unit: "px",
            default: 20,
            value: null,
            target: [".text"],
            special: "",
          },
          // TODO: proper font selector
          {
            key: "Font Family",
            css: "font-family",
            type: "font",
            default: "Helvetica",
            value: null,
            target: [".text"],
            special: "",
          },
          {
            key: "Color",
            css: "color",
            type: "csscolor",
            default: "White",
            value: null,
            target: [".text"],
            special: "",
          },
          {
            key: "Bold",
            special: "bold",
            css: "",
            type: "boolean",
            default: false,
            value: null,
            target: [".text"],
          },
        ],
      },
    ];

    return {
      globalDisplay: makeDefaultConfig(),
      specificDisplays: new Array(MAX_LIVE_ELEMENTS)
        .fill(0)
        .map((_) => makeDefaultConfig()),
    } as FullDisplayConfigType;
  };

  try {
    const fConfig: FullDisplayConfigType = JSON.parse(
      fs.readFileSync(getConfigPath(), "utf8"),
    );

    const curConfig = makeDefaultFullConfig();

    updateDisplay(curConfig.globalDisplay, fConfig.globalDisplay);
    for (let i = 0; i < MAX_LIVE_ELEMENTS; i++) {
      updateDisplay(curConfig.specificDisplays[i], fConfig.specificDisplays[i]);
    }

    return curConfig;
  } catch (err) {
    fs.writeFileSync(getConfigPath(), JSON.stringify(makeDefaultFullConfig()));
    return makeDefaultFullConfig();
  }
};

/* FIXME: chatgpt code. beware */
protocol.registerSchemesAsPrivileged([
  {
    scheme: "mssf",
    privileges: { secure: true, standard: true, supportFetchAPI: true },
  },
]);

// FIXME: chatgpt code. beware

app.on("ready", () => {
  // NOTE: moved out of app.on("ready", ...
  protocol.handle("mssf", async (request) => {
    const url = new URL(request.url);
    const filePath = path.resolve(
      path.normalize(decodeURIComponent(url.pathname)),
    );

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      const fileBuffer = await fs.promises.readFile(filePath);
      return new Response(fileBuffer, { status: 200 });
    } catch {
      return new Response("File Not Found", { status: 404 });
    }
  });

  //loading settings **blocking**
  const mainWindow = new BrowserWindow({
    minWidth: 400,
    minHeight: 400,
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

  // INFO: display css managment horror

  activeConfig = readFullConfig();

  const getSpecificDisplayCss = (index: number) => {
    // copy activeConfig
    const resConfig = JSON.parse(
      JSON.stringify(activeConfig!.globalDisplay),
    ) as DisplayConfigType;

    resConfig.forEach((dsc, i) => {
      dsc.entries.forEach((entry) => {
        entry.default = entry.value !== null ? entry.value : entry.default;
        const activeSpecificFoundEntry = activeConfig!.specificDisplays[index][
          i
        ].entries.find((x) => x.key === entry.key)!;
        entry.value = activeSpecificFoundEntry.value;
      });
    });

    const getEntryCss = (entry: DisplayConfigEntryType) => {
      let value: any;
      if (!entry.special) {
        if (entry.type === "path") {
          value = entry.value !== null ? entry.value : entry.default;
          value = value !== null ? value : "";
          value = (value as string).replace(/\\/g, "/");
          value = "file:///" + value;
          return `${entry.css}: url("${value}");`;
        }
        if (entry.type === "number") {
          const suffix = entry.unit ? entry.unit : "";
          const value = entry.value !== null ? entry.value : entry.default;
          return `${entry.css}: ${value}${suffix};`;
        }
      } else {
        switch (entry.special) {
          case "bold":
            value = entry.value !== null ? entry.value : entry.default;
            if (value) {
              return "font-weight: bold;";
            } else {
              return "font-weight: normal;";
            }
            break;
        }
      }
      value = entry.value !== null ? entry.value : entry.default;
      return `${entry.css}: ${value};`;
    };

    const newCss = resConfig
      .flatMap((dsc) => {
        return dsc.entries.flatMap((dse) => {
          return dse.target.map((t) => {
            return `${t} { ${getEntryCss(dse)} }`;
          });
        });
      })
      .reduce((p, c) => p + " " + c);
    return newCss;
  };

  // INFO: IPC display settings handling

  handleJSONAsync("read-display-settings", async (_) => activeConfig);

  ipcMain.handle("req-css", (_event, index) => {
    return getSpecificDisplayCss(index)
  });

  ipcMain.on(
    "update-css",
    (
      _event,
      index: number,
      arrayName: string,
      entry: DisplayConfigEntryType,
    ) => {
      const updateeArray = (
        index == -1
          ? activeConfig!.globalDisplay
          : activeConfig!.specificDisplays[index]
      ).find((dcs) => dcs.name === arrayName)!.entries;


      updateeArray.find((x) => x.key === entry.key)!.value = entry.value;
      console.log(`updated activeConfig. wrote index: ${index}, key: ${entry.key}, value: ${entry.value}`);

      fs.writeFile(getConfigPath(), JSON.stringify(activeConfig), (err) => {
        console.log("wrote config.json", err);
      });

      Array(MAX_LIVE_ELEMENTS)
        .fill(0)
        .map((_, i) => {
          sendToAllDisplayWindows(`update-${i}-css`, getSpecificDisplayCss(i));
        });
    },
  );

  // INFO: File writing handling (needs main window as parent window)

  ipcMain.handle("save-song", (_event, song) => {
    return new Promise<void>((resolve, reject) => {
      dialog
        .showSaveDialog(mainWindow, {
          title: "Save Song",
          buttonLabel: "Save",
          filters: [{ name: "txt", extensions: ["txt"] }],
        })
        .then((res) => {
          if (res.canceled) {
            resolve();
          } else {
            writeMSSFile(res.filePath, song).then(
              () => {
                resolve();
              },
              (err) => {
                reject(err);
              },
            );
          }
        });
    });
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("new-display-window", (_event, index: number) => {
  new DisplayWindow(index);
});

ipcMain.on("alert", (_event, message: string) => {
  dialog.showMessageBox({ message: message });
});

// INFO: IPC reading files

ipcMain.handle("read-element", (_event) => {
  return new Promise((resolve: (arg0: OpenElementType) => any, reject) => {
    dialog.showOpenDialog({ properties: ["openFile"] }).then((result) => {
      if (!result.canceled) {
        const fp = result.filePaths[0];
        const bn = path.basename(fp);
        if (bn.match(/\.(txt|mss)$/)) {
          readMSSFile(fp).then(
            (s) => {
              resolve({
                type: "song",
                song: s,
                selected: { object: null, verseID: 0, sectionID: 0 },
              });
            },
            (e) => {
              dialog.showErrorBox(`Error reading song ${bn}.`, e.message);
              reject();
            },
          );
        } else if (
          bn.match(/\.(apng|png|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|svg|webp)$/)
        ) {
          resolve({
            type: "image",
            image: { path: fp.replace(/\\/g, "/"), title: bn },
          });
        } else {
          dialog.showErrorBox("Error reading file: ", bn);
          reject();
        }
      }
    });
  });
});

ipcMain.handle("read-image", (_event) => {
  return new Promise((resolve, _reject) => {
    dialog
      .showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["jpg", "png", "gif"] }],
      })
      .then((result) => {
        if (!result.canceled) {
          resolve(result.filePaths[0]);
        }
      });
  });
});
