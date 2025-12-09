const { ipcRenderer, contextBridge } = require("electron");


function makeIpcSend(channel: string) {
  return (...args: any[]) => { ipcRenderer.send(channel, ...args) };
}
function makeIpcInvoke(channel: string) {
  return (...args: any[]) => { ipcRenderer.invoke(channel, ...args) };
}
function makeIpcOn(channel: string) {
  return (callback: (...args: any[]) => void) => {
    const listener = (_event: any, ...args: any[]) => { callback(...args) };
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    }
  };
}


contextBridge.exposeInMainWorld("electron", {
  onUIStateUpdate: makeIpcOn("ui-state-update"),
  sendUIStateRequest: makeIpcSend("ui-state-request"),
});
