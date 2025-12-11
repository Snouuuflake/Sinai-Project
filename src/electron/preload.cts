const { ipcRenderer, contextBridge } = require("electron");


function makeIpcSend(channel: string) {
  return (...args: any[]) => {
    console.log("ipc send:", channel, ...args);
    ipcRenderer.send(channel, ...args);
  };
}
function makeIpcInvoke(channel: string) {
  return (...args: any[]) => {
    console.log("ipc invoke:", channel, ...args);
    ipcRenderer.invoke(channel, ...args)
  };
}
function makeIpcOn(channel: string) {
  return (callback: (...args: any[]) => void) => {
    const listener = (_event: any, ...args: any[]) => { callback(...args) };
    ipcRenderer.on(channel, listener);
    const logger = (_event: any, ...args: any[]) => {
      console.log("ipc on", channel, ...args);
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
  sendUIStateRequest: makeIpcSend("ui-state-request"),
  sendAddImages: makeIpcSend("add-images"),
  sendMoveMedia: makeIpcSend("move-media"),
  sendDeleteMedia: makeIpcSend("delete-media"),
});
