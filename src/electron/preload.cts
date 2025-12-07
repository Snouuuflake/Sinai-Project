const electron = require("electron");

/**
 * Stupid function that returns a remove listener function for use with useEffect
 */
const useIpcListener = (
  channel: string,
  callback: (...args: any[]) => void,
) => {
  return () => {
    const listener = (_event: Electron.IpcRendererEvent, ...largs: any[]) => {
      callback(...largs);
    };
    electron.ipcRenderer.on(channel, listener);
    return () => {
      electron.ipcRenderer.removeListener(channel, listener);
    };
  };
};

const ipcInvokeJSON = (channel: string, obj: any) => {
  return new Promise<any>((resolve) => {
    electron.ipcRenderer
      .invoke(channel, JSON.stringify(obj))
      .then((jsonRes) => resolve(JSON.parse(jsonRes)));
  });
};

const makeInvokeJSON = (channel: string) => {
  return (obj: any) => ipcInvokeJSON(channel, obj);
};

const makeIpcSend = (channel: string) => {
  return (...args: any[]) => electron.ipcRenderer.send(channel, ...args);
};

electron.contextBridge.exposeInMainWorld("electron", {
  // for react
  useIpcListener: useIpcListener,
  invokeReadElement: (callback: (newElement: OpenElementType) => void) => {
    electron.ipcRenderer.invoke("read-element").then(
      (res: OpenElementType) => {
        callback(res);
      },
      (e) => {
        console.error(e);
      },
    );
  },
  invokeSaveSong: (song: Song): Promise<void> => {
    return electron.ipcRenderer.invoke("save-song", song) as Promise<void>;
  },

  /**
   * @param {number} index Display index
   */
  sendSetLiveElement: (index: number, liveElement: LiveElementType) => {
    electron.ipcRenderer.send("set-live-element", {
      index: index,
      liveElement: liveElement,
    });
  },
  sendSetLogo: (value: boolean) => {
    electron.ipcRenderer.send("set-logo", value);
  },
  invokeGetLogo: (callback: (logo: boolean) => void) => {
    electron.ipcRenderer.invoke("get-logo").then((value) => {
      callback(value);
    });
  },

  invokeImagePath: (): Promise<string> => {
    return electron.ipcRenderer.invoke("read-image") as Promise<string>;
  },

  // for display window
  invokeReadDisplaySetting: makeInvokeJSON("read-display-settings"),
  testFunction: () => console.log("Hello, World!"),
  sendNewDisplayWindow: (index: number) => {
    electron.ipcRenderer.send("new-display-window", index);
  },
  sendAlert: (message: string) => {
    electron.ipcRenderer.send("alert", message);
  },
  invokeIndex: () => electron.ipcRenderer.invoke("invoke-index"),
  sendGetLiveElement: (index: number) => {
    electron.ipcRenderer.send("get-live-element", index);
  },
  invokeReqCss: (index: number, callback: (css: string) => void) => {
    electron.ipcRenderer.invoke("req-css", index).then(css => callback(css));
  },
  sendUpdateCss: (
    index: number,
    arrayName: string,
    entry: DisplayConfigEntryType,
  ) => {
    electron.ipcRenderer.send("update-css", index, arrayName, entry);
  },
  onResCss: (index: number, callback: (css: string) => void) => {
    electron.ipcRenderer.on(`res-${index}-css`, (_event, data) =>
      callback(data),
    );
  },
  onUpdateCss: (index: number, callback: (css: string) => void) => {
    electron.ipcRenderer.on(`update-${index}-css`, (_event, data) =>
      callback(data),
    );
  },
  onDisplayLogo: (callback: (logo: boolean) => void) => {
    electron.ipcRenderer.on("display-logo", (_event, value) => {
      callback(value);
    });
  },
  onDisplayText: (index: number, callback: (text: string) => void) => {
    electron.ipcRenderer.on(`display-${index}-text`, (_event, data) => {
      callback(data);
    });
  },
  onDisplayNone: (index: number, callback: () => void) => {
    electron.ipcRenderer.on(`display-${index}-none`, (_event, data) => {
      callback();
    });
  },
  onDisplayImage: (index: number, callback: (path: string) => void) => {
    electron.ipcRenderer.on(`display-${index}-image`, (_event, data) => {
      callback(data);
    });
  },
});
