import http from "http";
import { AddressInfo, WebSocketServer } from "ws";
import { IpcWs } from "./IpcWs.js";

import { Express } from "express";
import { dialog } from "electron";

class ServerManager {
  #httpServer: http.Server | null = null;
  #wss: WebSocketServer | null = null;
  #port: number | null = null;
  #expressApp: Express;
  #ipcws: IpcWs;
  #pending: Promise<void> = Promise.resolve();

  updatePortCallback: ((port: number | null) => void) | null = null;

  constructor(expressApp: Express, ipcws: IpcWs) {
    this.#ipcws = ipcws;
    this.#expressApp = expressApp;
  }

  get port() {
    return this.#port;
  }

  #updatePort(port: number | null) {
    this.#port = port;
    if (this.updatePortCallback)
      this.updatePortCallback(port);
  }

  get isRunning() {
    return this.#httpServer !== null;
  }

  // closes wss clients, closes wss server
  // closes http server and its conections
  // set servers and ports to null
  async #doStop() {
    if (this.#wss) {
      this.#wss.clients.forEach(client => {
        client.close(1000);
      });
      await new Promise<void>((resolve) => {
        this.#wss!.close(() => {
          this.#wss!.removeAllListeners();
          resolve();
        })
      })
    }

    if (this.#httpServer) {
      await new Promise<void>((resolve) => {
        this.#httpServer!.closeAllConnections();
        this.#httpServer!.close((err) => {
          if (err)
            console.error("ServerManager: error closing http server", err)
          resolve();
        })
      })
    }

    this.#wss = null;
    this.#httpServer = null;
    this.#updatePort(null);
  }

  // re-starts server with given port, handles errors silently but port gets set to null;
  async #doStart(port: number) {
    console.log("ServerManager.start()");

    await this.#doStop();

    const httpServer = http.createServer(this.#expressApp);

    this.#httpServer = httpServer;

    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: NodeJS.ErrnoException) => {
          console.error("ServerManager.#doStart(): error in httpServer.once", err)
          reject(err);
        };
        httpServer.on("error", onError);
        httpServer.listen(
          port,
          () => {
            httpServer.removeListener("error", onError);
            let realPort: number | null = null
            realPort = (httpServer.address() as AddressInfo).port;
            this.#updatePort(realPort);
            console.log(`ServerManager.start() callback - resolving with port ${port}`);
            resolve();
          }
        )
      });
      const wss = new WebSocketServer({ server: httpServer });
      this.#ipcws.initWss(wss);
      this.#wss = wss;
    } catch (err) {
      console.error("ServerManager.start() - failed to listen:", err)
      await this.#doStop();
    }
  }

  // queues a #doStop
  stop(): Promise<void> {
    const next = this.#pending.then(() => this.#doStop());
    this.#pending = next.catch(() => { });
    return next;
  }

  // queues a #doStart
  start(port: number): Promise<void> {
    const next = this.#pending.then(() => this.#doStart(port));
    this.#pending = next.catch(() => { });
    return next;
  }

  #startTimer: ReturnType<typeof setTimeout> | null = null;

  scheduleStart(port: number) {
    console.log("AppState.#scheduleWriteConfig()")
    const DELAY = 1000; //ms
    if (this.#startTimer !== null) clearTimeout(this.#startTimer);
    this.#startTimer = setTimeout(
      () => {
        this.#startTimer = null;
        this.start(port)
      },
      DELAY
    );
  }
}

export { ServerManager };
