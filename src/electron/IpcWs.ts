/**
 * Server / main process module for allowing IPC (-style) communication from both Electron 
 * BrowserWindow(s) and windows served from Electron to an actual browser (Chrome, Firefox, etc)
 */

import { ipcMain } from "electron";
import { WebSocketServer, WebSocket } from "ws";

// ignore, redundant
// import { ALLOWED_DISPLAY_INVOKE_CHANNELS, ALLOWED_DISPLAY_SEND_CHANNELS } from "./electron-constants.js";

type ipcwsSendMessage = {
  type: "send"
  channel: string,
  args: any[],
}
type ipcwsInvokeMessage = {
  type: "invoke"
  channel: string,
  args: any[],
  id: number,
}
type ipcwsMessage = ipcwsInvokeMessage | ipcwsSendMessage;

// This is a class soasto be able to instantiate the WebSocketServer outside the module, in the main script
class IpcWs {
  #wsClients = new Set<WebSocket>();
  #invokeHandlers = new Map<string, (...args: any[]) => any>();
  #wss: WebSocketServer | null = null;
  #allowedOnChannels: string[];
  #allowedInvokeChannels: string[];

  constructor(
    allowedOnChannels: string[],
    allowedInvokeChannels: string[],
  ) {
    this.#allowedOnChannels = allowedOnChannels;
    this.#allowedInvokeChannels = allowedInvokeChannels;
  }

  /**
   * (re-)inits "ipc" via the proviede WSS.
   * deletes any old connections upon being called.
   */
  initWss(wss: WebSocketServer) {
    this.#wss = wss;
    this.#wsClients.clear();

    this.#wss.on("connection", (ws) => {
      this.#wsClients.add(ws);
      ws.on("close", () => this.#wsClients.delete(ws));

      ws.on("message", async (raw) => {
        const msg: ipcwsMessage = JSON.parse(raw.toString());
        if (msg.type === "send") {
          // emits the normal IPC event for the message's channel
          // which calls all handlers normally
          if (this.#allowedOnChannels.includes(msg.channel))
            ipcMain.emit(msg.channel, {}, ...msg.args);
        } else if (msg.type === "invoke") {
          // invoke handlers are registered with ipcMain.handle for both 
          // Electron and WebSockets in our own IpcWs.handle
          // we call them here and send the result as an invoke-reply messages to the client

          if (!this.#allowedInvokeChannels.includes(msg.channel))
            return;
          const handler = this.#invokeHandlers.get(msg.channel);
          const result = handler ? await handler(...msg.args) : undefined;
          try {
            console.log("sending invoke-reply", msg.id, result);
            ws.send(JSON.stringify({ type: "invoke-reply", id: msg.id, result }), console.error);
          } catch (err) {
            console.error(err)
          }
        }
        return;
      });
    });
  }

  /**
   * sends a "on" message to all WebSockets connected to the WebSocketServer
   */
  broadcastToWsClients(channel: string, ...args: any[]) {
    const payload = JSON.stringify({ type: "on", channel, args });
    console.log("broadcast to wsclients: ", payload.substring(0, 80));
    for (const ws of this.#wsClients) {
      try {
        ws.send(payload);
      } catch (err) {
        console.error(err)
      }
    }
  }

  /**
   * WARN: this thing does not take event as the first argument of handler, we have foregone that functionality
   *
   * Wrapper for ipcMain.handle function; if you want to handle both BrowserWindow and real browsers' invokes, use only this one
   */
  handle(channel: string, handler: (...args: any[]) => any,) {
    ipcMain.handle(channel, (_event, ...args: any[]) => { return handler(...args) });
    if (this.#invokeHandlers.get(channel)) {
      throw new Error(`ipcws.handle: handler for channel ${channel} already exists`)
    }
    this.#invokeHandlers.set(channel, handler);
  }
}

export {
  IpcWs
}
