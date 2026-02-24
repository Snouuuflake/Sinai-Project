import { ipcRenderer, contextBridge } from "electron";
import { ALLOWED_DISPLAY_INVOKE_CHANNELS, ALLOWED_DISPLAY_SEND_CHANNELS } from "./electron-constants.cjs";

function ipcRendererSendS(channel: string, ...args: any[]) {
  if (!ALLOWED_DISPLAY_SEND_CHANNELS.includes(channel))
    throw new Error("ipcRendererSendS: Tried to use disallowed channel");
  ipcRenderer.send(channel, ...args)
}

function ipcRendererOnS(channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => any) {
  ipcRenderer.on(channel, callback);
  return () => { ipcRenderer.off(channel, callback) }
}

function ipcRendererInvokeS(channel: string, ...args: any[]): Promise<any> {
  if (!ALLOWED_DISPLAY_INVOKE_CHANNELS.includes(channel))
    throw new Error("ipcRendererInvokeS: Tried to use disallowed channel");
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("electron", {
  ipcRendererInvokeS,
  ipcRendererOnS,
  ipcRendererSendS
});
