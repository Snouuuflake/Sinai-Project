import http from "http";

class ManagedHttpServer {
  httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null = null;
  constructor() {
  }
  // start(port)
}

export { ManagedHttpServer }
