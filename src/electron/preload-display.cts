import { ipcRenderer, contextBridge } from "electron";

const ALLOWED_DISPLAY_SEND_CHANNELS: string[] = [
  "alert",
  "ui-display-config-request"
] as const;

const ALLOWED_DISPLAY_INVOKE_CHANNELS: string[] = [
  "invoke-display-get-init-live-state"
] as const;

function ipcRendererSendS(channel: string, ...args: any[]) {
  if (!ALLOWED_DISPLAY_SEND_CHANNELS.includes(channel))
    throw new Error(`ipcRendererSendS: Tried to use disallowed channel ${channel}`);
  ipcRenderer.send(channel, ...args)
}

function ipcRendererOnS(channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => any) {
  ipcRenderer.on(channel, callback);
  return () => { ipcRenderer.off(channel, callback) }
}

function ipcRendererInvokeS(channel: string, ...args: any[]): Promise<any> {
  if (!ALLOWED_DISPLAY_INVOKE_CHANNELS.includes(channel))
    throw new Error(`ipcRendererInvokeS: Tried to use disallowed channel ${channel}`);
  return ipcRenderer.invoke(channel, ...args)
}

contextBridge.exposeInMainWorld("electron", {
  ipcRendererInvokeS,
  ipcRendererOnS,
  ipcRendererSendS
});
