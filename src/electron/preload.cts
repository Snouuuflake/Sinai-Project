const electron = require("electron");


const makeIpcSend = (channel: string) => {
  return (...args: any[]) => electron.ipcRenderer.send(channel, ...args);
};

electron.contextBridge.exposeInMainWorld("electron", {
  // for react
});
