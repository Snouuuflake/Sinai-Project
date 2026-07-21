import http from "http";
import { AddressInfo, WebSocketServer } from "ws";
import { IpcWs } from "./IpcWs.js";

import { Express } from "express";

class ServerManager {
  #httpServer: http.Server | null = null;
  #wss: WebSocketServer | null = null;
  #port: number | null = null;
  #expressApp: Express;
  #ipcws: IpcWs;

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

  async stop() {
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
    this.#httpServer = null
    this.#updatePort(null);
  }

  async start() {
    console.log("ServerManager.start()");

    await this.stop();

    const httpServer = http.createServer(this.#expressApp);
    const wss = new WebSocketServer({ server: httpServer });

    this.#httpServer = httpServer;
    this.#wss = wss;

    this.#ipcws.initWss(wss);

    httpServer.listen(
      0,
      () => {
        let port: number | null = null
        try {
          port = (httpServer.address() as AddressInfo).port;
        } catch (err) {
          console.error("ServerManager.start() - caught in httpServer.listen:", err);
        }
        this.#updatePort(port);
        console.log("ServerManager.start() - now listening!");
      }
    )
  }
}

export { ServerManager };
