import { IPCControl, IPCPlayer, ipcDelimiter } from "@0rhxplayer/shared";
import type { IPCClientMsg, IPCServerMsg } from "@0rhxplayer/shared";
import { PLAYER, posHandler } from "./player.js";
import { RETAIN_FILE, ipcBroadcastServerPath, ipcServerPath } from "./constant.js";
import type { Server, Socket } from "node:net";
import { logError } from "./utils.js";
import { readFile, writeFile } from "node:fs/promises";
import { STATE } from "./state.js";
import { createServer } from "node:net";
import { rmSync } from "node:fs";

class IPCServer {
  #first = true;

  #retain: unknown[] = [];

  #retainState = false;

  #timer?: NodeJS.Timeout;

  readonly #sockets = new Set<Socket>();

  readonly #buffer = new WeakMap<Socket, string>();

  readonly #server: Server;

  constructor() {
    readFile(RETAIN_FILE)
      .then((buf) => (this.#retain = <unknown[]>JSON.parse(buf.toString())))
      .catch(logError);

    try {
      rmSync(ipcServerPath, { recursive: true, force: true });
    } catch {} // named pipes on Windows may report spurious errors

    // Watch the parent VS Code process: when it exits and no client remains,
    // stop playback and leave, so music never keeps playing in the background.
    const parentPid = parseInt(<string>process.env["CM_PARENT_PID"], 10);
    if (parentPid > 0) {
      setInterval(() => {
        if (this.#sockets.size) return;
        try {
          process.kill(parentPid, 0);
        } catch {
          PLAYER.stop();
          this.stop();
          IPC_BCST_SRV.stop();
          process.exit(0);
        }
      }, 3000);
    }

    this.#server = createServer((socket) => {
      if (this.#timer) {
        clearTimeout(this.#timer);
        this.#timer = undefined;
      }
      this.#sockets.add(socket);
      this.#buffer.set(socket, "");

      socket
        .setEncoding("utf8")
        .on("data", (data) => {
          const buffer = (this.#buffer.get(socket) ?? "") + data.toString();

          const msgs = buffer.split(ipcDelimiter);
          this.#buffer.set(socket, msgs.pop() ?? "");
          for (const msg of msgs) this.#handler(<IPCClientMsg>JSON.parse(msg), socket);
        })
        .on("close", (/* err */) => {
          socket?.destroy();
          this.#sockets.delete(socket);
          this.#buffer.delete(socket);

          if (this.#sockets.size) this._setMaster();
          else this.#suspend();
        })
        .on("error", logError);

      this._setMaster();

      if (this.#sockets.size === 1) {
        if (this.#first) this.#first = false;
        else this.#resume(socket);
      } else {
        this.sendToMaster({ t: IPCControl.new });
        this.send(socket, { t: PLAYER.playing ? IPCPlayer.play : IPCPlayer.pause });
      }
    })
      .on("error", (e) => logError(e))
      .listen(ipcServerPath);
  }

  get #master(): Socket | undefined {
    const [socket] = this.#sockets;
    return socket;
  }

  stop() {
    this.#server.close(() => {
      for (const socket of this.#sockets) socket?.destroy();
      this.#sockets.clear();
    });
  }

  send(socket: Socket, data: IPCServerMsg) {
    socket.write(`${JSON.stringify(data)}${ipcDelimiter}`);
  }

  sendToMaster(data: IPCServerMsg): void {
    this.#master?.write(`${JSON.stringify(data)}${ipcDelimiter}`);
  }

  broadcast(data: IPCServerMsg): void {
    const str = `${JSON.stringify(data)}${ipcDelimiter}`;
    for (const socket of this.#sockets) socket.write(str);
  }

  _setMaster() {
    const [master, ...slaves] = this.#sockets;
    this.send(master, { t: IPCControl.master, is: true });
    for (const slave of slaves) this.send(slave, { t: IPCControl.master });
  }

  #resume(socket: Socket): void {
    if (this.#retainState) PLAYER.play();
    this.send(socket, { t: IPCControl.retain, items: this.#retain, play: this.#retainState, seek: PLAYER.lastPos });
    this.#retain = [];
  }

  #suspend(): void {
    this.#retainState = PLAYER.playing;
    PLAYER.pause();
    this.#timer = setTimeout(() => {
      if (this.#sockets.size) return;
      this.stop();
      IPC_BCST_SRV.stop();
      void writeFile(RETAIN_FILE, JSON.stringify(this.#retain)).finally(() => process.exit());
    }, 40000);
  }

  #handler(data: IPCClientMsg, socket: Socket): void {
    switch (data.t) {
      case IPCControl.retain:
        if (data.items) this.#retain = <unknown[]>data.items;
        else this.send(socket, { t: IPCControl.retain, items: this.#retain });
        break;
      case IPCPlayer.load:
        return void PLAYER.load(data).catch(logError);
      case IPCPlayer.lyricDelay:
        return void (STATE.lyric.delay = data.delay);
      case IPCPlayer.playing:
        return void (PLAYER.playing = data.playing);
      case IPCPlayer.position:
        return posHandler(data.pos);
      case IPCPlayer.toggle:
        return PLAYER.toggle();
      case IPCPlayer.stop:
        PLAYER.stop();
        return this.broadcast(data);
      case IPCPlayer.volume:
        PLAYER.volume(data.level);
        return this.broadcast(data);
      case IPCPlayer.speed:
        PLAYER.speed(data.speed);
        return this.broadcast(data);
      case IPCPlayer.seek:
        return PLAYER.seek(data.seekOffset);
    }
  }
}

class IPCBroadcastServer {
  readonly #sockets = new Set<Socket>();

  readonly #server: Server;

  constructor() {
    try {
      rmSync(ipcBroadcastServerPath, { recursive: true, force: true });
    } catch {} // named pipes on Windows may report spurious errors

    this.#server = createServer((socket) => {
      this.#sockets.add(socket);

      socket
        .setEncoding("utf8")
        .on("data", (data) => this.#broadcast(data))
        .on("close", (/* err */) => {
          socket?.destroy();
          this.#sockets.delete(socket);
        })
        .on("error", logError);
    })
      .on("error", (e) => logError(e))
      .listen(ipcBroadcastServerPath);
  }

  stop(): void {
    this.#server.close(() => {
      for (const socket of this.#sockets) socket?.destroy();
      this.#sockets.clear();
    });
  }

  #broadcast(data: Buffer): void {
    for (const socket of this.#sockets) socket.write(data);
  }
}

export const IPC_SRV = new IPCServer();
export const IPC_BCST_SRV = new IPCBroadcastServer();
