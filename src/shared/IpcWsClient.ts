type IpcHandler = (...args: any[]) => void;

function isElectron(): boolean {
  return typeof window !== "undefined" && !!(window as any).electron;
}

let ws: WebSocket | null = null;
let wsReady = false;
const wsQueue: string[] = [];
const wsListeners = new Map<string, Set<IpcHandler>>();
let invokeIdCounter = 0;
const pendingInvokes = new Map<number, (result: any) => void>();

function getWs(): WebSocket {
  if (ws) return ws;

  const port = parseInt(window.location.port);
  ws = new WebSocket(`ws://localhost:${port}`);

  ws.addEventListener("open", () => {
    wsReady = true;
    wsQueue.forEach(m => ws!.send(m));
    wsQueue.length = 0;
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "on") {
      console.log("msg:", msg.type, msg.channel, ...msg.args ?? []);
      const handlers = wsListeners.get(msg.channel);
      if (handlers) handlers.forEach(h => h(...msg.args));
    } else if (msg.type === "invoke-reply") {
      console.log("msg:", msg.type, msg.channel, msg.id, msg.result);
      const resolve = pendingInvokes.get(msg.id);
      if (resolve) { resolve(msg.result); pendingInvokes.delete(msg.id); }
    } else {
      console.log(msg)
    }
  });

  ws.addEventListener("close", () => { ws = null; wsReady = false; });
  return ws;
}

function wsSend(msg: object) {
  const s = JSON.stringify(msg);
  const sock = getWs();
  if (wsReady) sock.send(s);
  else wsQueue.push(s);
}

export const customipc = {
  on(channel: string, callback: IpcHandler): () => void {
    if (isElectron()) {
      return (window as unknown as DisplayWindow).electron.ipcRendererOnS(channel, (_event, ...values: any[]) => { callback(...values) });
    } else {
      if (!wsListeners.has(channel)) wsListeners.set(channel, new Set());
      wsListeners.get(channel)!.add(callback);
      getWs(); // ensure connected
      return () => wsListeners.get(channel)?.delete(callback);
    }
  },

  send(channel: string, ...args: any[]): void {
    if (isElectron()) {
      (window as unknown as DisplayWindow).electron.ipcRendererSendS(channel, ...args);
    } else {
      wsSend({ type: "send", channel, args });
    }
  },

  invoke(channel: string, ...args: any[]): Promise<any> {
    if (isElectron()) {
      return (window as unknown as DisplayWindow).electron.ipcRendererInvokeS(channel, ...args);
    } else {
      return new Promise((resolve) => {
        const id = invokeIdCounter++;
        console.log(`invoked with id ${id}`, channel, ...args);
        pendingInvokes.set(id, resolve);
        wsSend({ type: "invoke", channel, args, id });
      });
    }
  }
};
