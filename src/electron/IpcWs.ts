import { ipcMain } from "electron";
import { WebSocketServer, WebSocket } from "ws";

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

class IpcWs {
  #wsClients = new Set<WebSocket>();
  #invokeHandlers = new Map<string, (...args: any[]) => any>();
  #wss: WebSocketServer | null = null;
  initWss(wss: WebSocketServer) {
    this.#wss = wss;
    this.#wss.on("connection", (ws) => {
      this.#wsClients.add(ws);
      ws.on("close", () => this.#wsClients.delete(ws));

      ws.on("message", async (raw) => {
        const msg: ipcwsMessage = JSON.parse(raw.toString());
        // msg: { type: "send"|"invoke", channel, args, id? }
        if (msg.type === "send") {
          ipcMain.emit(msg.channel, {}, ...msg.args);
        } else if (msg.type === "invoke") {
          // invoke handlers are registered with ipcMain.handle
          // we need to call them manually
          const handler = this.#invokeHandlers.get(msg.channel);
          const result = handler ? await handler(...msg.args) : undefined;
          try {
            ws.send(JSON.stringify({ type: "invoke-reply", id: msg.id, result }));
          } catch (err) {
            console.error(err)
          }
        }
        return;
      });
    });
  }
  constructor() {
  }

  broadcastToWsClients(channel: string, ...args: any[]) {
    const payload = JSON.stringify({ type: "on", channel, args });
    console.log(payload)
    for (const ws of this.#wsClients) {
      try {
        ws.send(payload);
        console.log(ws, payload)
      } catch (err) {
        console.error(err)
      }
    }
  }

  handleIpcWs(channel: string, handler: (...args: any[]) => any,) {
    ipcMain.handle(channel, (_event, ...args: any[]) => { handler(...args) });
    if (this.#invokeHandlers.get(channel)) {
      throw new Error(`ipcws.handle: handler for channel ${channel} already exists`)
    }
    this.#invokeHandlers.set(channel, handler);
  }
}


// Call this wherever you'd call sendToDisplayWindows, sendToUIWindow, etc.

/**
 * WARN: this thing does not take event as the first argument of handler, we have foregone that functionality
  */


export {
  IpcWs
}
