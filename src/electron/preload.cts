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
  onUIStateUpdateLogo: makeIpcOn("ui-state-update-logo"),
  sendUIStateRequest: makeIpcSend("ui-state-request"),

  onUIUpdateDisplayConfig: makeIpcOn("ui-update-display-config"),
  sendUIDisplayConfigRequest: makeIpcSend("ui-display-config-request"),
  sendUISetDisplayConfigEntry: makeIpcSend("ui-set-display-config-entry"),
  sendUIResetDisplayConfigEntry: makeIpcSend("ui-reset-display-config-entry"),
  sendDisplayConfigInputPath: makeIpcSend("ui-display-config-input-path"),

  onUIUpdateGeneralConfig: makeIpcOn("ui-update-general-config"),
  sendUIGeneralConfigRequest: makeIpcSend("ui-general-config-request"),
  sendUISetGeneralConfigEntry: makeIpcSend("ui-set-general-config-entry"),
  sendUIResetGeneralConfigEntry: makeIpcSend("ui-reset-general-config-entry"),
  sendGeneralConfigInputPath: makeIpcSend("ui-general-config-input-path"),

  sendNewDisplayWindow: makeIpcSend("new-display-window"),
  sendSetOpenMedia: makeIpcSend("set-open-media"),
  sendSetLiveElement: makeIpcSend("set-live-element"),
  sendSetLogo: makeIpcSend("set-logo"),
  sendAddImages: makeIpcSend("add-images"),
  sendAddSongs: makeIpcSend("add-songs"),
  sendMoveMedia: makeIpcSend("move-media"),
  sendDeleteMedia: makeIpcSend("delete-media"),
  sendCreateSong: makeIpcSend("create-song"),
  sendReplaceSong: makeIpcSend("replace-song"),
  sendSaveSong: makeIpcSend("save-song"),

  onDisplayStateUpdateLiveElement: makeIpcOn("display-state-update-live-elements"),
  onDisplayStateUpdateLogo: makeIpcOn("display-state-update-logo"),
  onDisplayUpdateDisplayConfig: makeIpcOn("display-update-display-config"),

  invokeDisplayGetInitLiveState: makeIpcInvoke("invoke-display-get-init-live-state"),

  sendAlert: makeIpcSend("alert"),
});
