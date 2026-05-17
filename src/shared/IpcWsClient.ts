/**
 * Client module for allowing IPC (-style) communication from both Electron 
 * BrowserWindow(s) and windows served from Electron to an actual browser (Chrome, Firefox, etc)
 *
 * Requires the client to have a url with an explicit port (localhost:8000)
 * (this could easilty be abstracted i think but its not requiered for this project)
 */
import { isElectron } from "./isElectron";

type IpcHandler = (...args: any[]) => void;

let ws: WebSocket | null = null;
let wsReady = false;
const wsQueue: string[] = [];
const wsListeners = new Map<string, Set<IpcHandler>>();
let invokeIdCounter = 0;
const pendingInvokes = new Map<number, (result: any) => void>();

/**
  * Returns the current WebSocket object being used.
  * If there is no current WebSocket, instantiates a new one
  * @returns Current WebSocket object; value of ws
  */
function getWs(): WebSocket {
  if (ws) return ws;

  // WebSocket on same port as client url
  const port = parseInt(window.location.port);
  ws = new WebSocket(`ws://localhost:${port}`);

  ws.addEventListener("open", () => {
    wsReady = true;
    // if a previous WebSocket was closed, sends all pending messages and clears queue
    wsQueue.forEach(m => ws!.send(m));
    wsQueue.length = 0;
  });

  // when recieving a message:
  //
  // msg.type is used to replicate the diferent types of Electron IPC messages
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "on") {
      // normal "send" message, calls all registered handlers on the message's contents
      console.log("msg:", msg.type, msg.channel, ...msg.args ?? []);
      const handlers = wsListeners.get(msg.channel);
      if (handlers) handlers.forEach(h => h(...msg.args));
    } else if (msg.type === "invoke-reply") {
      // main process's reply to client sending an invoke message
      //
      // invoke message chains' messages have an id property so that replies on the
      // same channel dont get mixed. thus, pendingInvokes has the resolve functions
      // of all the promises returned to the client when calling Invoke refered to by
      // the aforementioned id
      console.log("msg:", msg.type, msg.channel, msg.id, msg.result);
      const resolve = pendingInvokes.get(msg.id);
      // resolves the original invoke's promise and the resolve function
      if (resolve) { resolve(msg.result); pendingInvokes.delete(msg.id); }
    } else {
      // should never happen
      console.log(msg)
    }
  });

  ws.addEventListener("close", () => { ws = null; wsReady = false; });
  return ws;
}

/**
  * sends message to WebSocket (or pushes message to the queue if !wsReady)
  */
function wsSend(msg: object) {
  const s = JSON.stringify(msg);
  const sock = getWs();
  if (wsReady) sock.send(s);
  else wsQueue.push(s);
}

/**
 * Object wrapping Electron and WS IPC function
 * Runs Electron functions only if running in an Electron BrowserWindow
 */
export const CustomIPC = {
  on(channel: string, callback: IpcHandler): () => void {
    if (isElectron()) {
      // ipcRendererOnS is a safe version of ipcRenderer.on, given that it can only use channels whitelisted in the preload file
      return (window as unknown as DisplayWindow).electron.ipcRendererOnS(channel, (_event, ...values: any[]) => { callback(...values) });
    } else {
      // creates channel in  channel doesn't exist and adds callback to channel
      if (!wsListeners.has(channel)) wsListeners.set(channel, new Set());
      wsListeners.get(channel)!.add(callback);
      getWs(); // ensure connected
      // Like Electron ipcRenderer.on, returns a function to delete the added listener
      // Needed for React effects
      return () => wsListeners.get(channel)?.delete(callback);
    }
  },

  send(channel: string, ...args: any[]): void {
    if (isElectron()) {
      // ipcRendererSendS is a safe version of ipcRenderer.send, given that it can only use channels whitelisted in the preload file
      (window as unknown as DisplayWindow).electron.ipcRendererSendS(channel, ...args);
    } else {
      wsSend({ type: "send", channel, args });
    }
  },

  invoke(channel: string, ...args: any[]): Promise<any> {
    if (isElectron()) {
      // ipcRendererInvokeS is a safe version of ipcRenderer.invoke, given that it can only use channels whitelisted in the preload file
      return (window as unknown as DisplayWindow).electron.ipcRendererInvokeS(channel, ...args);
    } else {
      return new Promise((resolve) => {
        // creates id for all messages related to this invoke
        const id = invokeIdCounter++;
        console.log(`invoked with id ${id}`, channel, ...args);
        // resolve function to pendingInvokes to be called when the server responds
        pendingInvokes.set(id, resolve);
        wsSend({ type: "invoke", channel, args, id });
      });
    }
  }
};
