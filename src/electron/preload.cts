const { ipcRenderer, contextBridge } = require("electron");


function makeIpcSend(channel: string) {
  return (...args: any[]) => {
    console.log("ipc send:", channel, ...args);
    ipcRenderer.send(channel, ...args);
  };
}
function makeIpcInvoke<T>(channel: string): (...args: any[]) => Promise<T> {
  return (...args: any[]) => {
    console.log("ipc invoke:", channel, ...args);
    return ipcRenderer.invoke(channel, ...args)
  };
}
function makeIpcOn(channel: string) {
  return (callback: (...args: any[]) => void) => {
    const listener = (_event: any, ...args: any[]) => { callback(...args) };
    ipcRenderer.on(channel, listener);
    const logger = (_event: any, ...args: any[]) => {
      console.log("ipc on:", channel, ...args);
    }
    ipcRenderer.on(channel, logger);
    return () => {
      ipcRenderer.removeListener(channel, listener);
      ipcRenderer.removeListener(channel, logger);
    }
  };
}


contextBridge.exposeInMainWorld("electron", {
  onUIStateUpdateSetlist: makeIpcOn("ui-state-update-setlist"),
  onUIStateUpdateOpenMedia: makeIpcOn("ui-state-update-open-media"),
  onUIStateUpdateLiveElements: makeIpcOn("ui-state-update-live-elements"),
  sendUIStateRequest: makeIpcSend("ui-state-request"),

  onUIUpdateDisplayConfig: makeIpcOn("ui-update-display-config"),
  sendUIDisplayConfigRequest: makeIpcSend("ui-display-config-request"),
  sendUISetDisplayConfigEntry: makeIpcSend("ui-set-display-config-entry"),
  sendUIResetDisplayConfigEntry: makeIpcSend("ui-reset-display-config-entry"),

  onUIUpdateGeneralConfig: makeIpcOn("ui-update-general-config"),
  sendUIGeneralConfigRequest: makeIpcSend("ui-general-config-request"),
  sendUISetGeneralConfigEntry: makeIpcSend("ui-set-general-config-entry"),
  sendUIResetGeneralConfigEntry: makeIpcSend("ui-reset-general-config-entry"),

  sendNewDisplayWindow: makeIpcSend("new-display-window"),
  sendSetOpenMedia: makeIpcSend("set-open-media"),
  sendSetLiveElement: makeIpcSend("set-live-element"),
  sendAddImages: makeIpcSend("add-images"),
  sendAddSongs: makeIpcSend("add-songs"),
  sendMoveMedia: makeIpcSend("move-media"),
  sendDeleteMedia: makeIpcSend("delete-media"),
  sendCreateSong: makeIpcSend("create-song"),
  sendReplaceSong: makeIpcSend("replace-song"),
  sendSaveSong: makeIpcSend("save-song"),

  onDisplayStateUpdateLiveElement: makeIpcOn("display-state-update-live-elements"),

  invokeDisplayGetInitLiveElement: makeIpcInvoke("invoke-display-get-init-live-element"),

  sendAlert: makeIpcSend("alert"),
});
