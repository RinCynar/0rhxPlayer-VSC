import { BUTTON_MANAGER } from "../manager/index.js";
import { IPC, LyricType, LyricViewProvider, STATE, defaultLyric } from "../utils/index.js";
import { NATIVE_MODULE, SETTING_DIR, SPEED_KEY, VOLUME_KEY } from "../constant/index.js";
import { IPCControl, IPCPlayer, IPCQueue, logFile } from "@0rhxplayer/shared";
import type { IPCBroadcastMsg, IPCServerMsg } from "@0rhxplayer/shared";
import { Uri, commands, window } from "vscode";
import { readdir, rm } from "node:fs/promises";
import type { ExtensionContext } from "vscode";
import type { PlayTreeItemData } from "../treeview/index.js";
import { QueueProvider } from "../treeview/index.js";
import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const ipcBHandler = (data: IPCBroadcastMsg) => {
  switch (data.t) {
    case IPCPlayer.load:
      return (STATE.loading = true);
    case IPCPlayer.loaded:
      return (STATE.loading = false);
    case IPCPlayer.repeat:
      return (STATE.repeat = data.r);
    case IPCQueue.add:
      return QueueProvider.add(<readonly PlayTreeItemData[]>data.items, data.index);
    case IPCQueue.clear:
      return QueueProvider.clear();
    case IPCQueue.delete:
      return QueueProvider.delete(data.id);
    case IPCQueue.new:
      QueueProvider.new(<readonly PlayTreeItemData[]>data.items, data.id);
      return STATE.downInit(); // queue ready (3/3)
    case IPCQueue.play:
      return QueueProvider.top(data.id);
    case IPCQueue.shift:
      return QueueProvider.shift(data.index);
  }
};

export async function initIPC(context: ExtensionContext): Promise<void> {
  const ipcHandler = (data: IPCServerMsg) => {
    switch (data.t) {
      case IPCControl.master:
        return (STATE.master = !!data.is);
      case IPCControl.new:
        return IPC.new();
      case IPCControl.retain:
        QueueProvider.new(<readonly PlayTreeItemData[]>data.items);
        return STATE.downInit(data.play, data.seek); // queue ready (3/3)
      case IPCControl.current:
        return STATE.restoreCurrent(data);
      case IPCPlayer.end:
        if (!data.fail && (STATE.repeat || data.reloadNseek)) IPC.load(!data.pause, data.reloadNseek);
        else void commands.executeCommand("0rhxplayer.next");
        return;
      case IPCPlayer.loaded:
        return (STATE.loading = false);
      case IPCPlayer.lyric:
        STATE.lyric = { ...STATE.lyric, ...data.lyric };
        return LyricViewProvider.lyric(data.lyric);
      case IPCPlayer.lyricIndex: {
        const lyric = STATE.lyric.text?.[data.idx];
        BUTTON_MANAGER.buttonLyric(lyric?.[LyricType.ori]);
        return LyricViewProvider.index(data.idx);
      }
      case IPCPlayer.pause:
        BUTTON_MANAGER.buttonPlay(false);
        return;
      case IPCPlayer.play:
        BUTTON_MANAGER.buttonPlay(true);
        return;
      case IPCPlayer.stop:
        BUTTON_MANAGER.buttonSong();
        BUTTON_MANAGER.buttonLyric();
        STATE.lyric = { ...STATE.lyric, ...defaultLyric };
        return;
      case IPCPlayer.volume:
        return BUTTON_MANAGER.buttonVolume(data.level);
      case IPCPlayer.next:
        return void commands.executeCommand("0rhxplayer.next");
      case IPCPlayer.previous:
        return void commands.executeCommand("0rhxplayer.previous");
      case IPCPlayer.speed:
        return BUTTON_MANAGER.buttonSpeed(data.speed);
    }
  };

  const logPath = resolve(SETTING_DIR, logFile);
  commands.registerCommand("0rhxplayer.openLogFile", () => void window.showTextDocument(Uri.file(logPath)));

  try {
    const firstTry = await IPC.connect(ipcHandler, ipcBHandler, 0);
    if (firstTry.includes(false)) throw Error;
    STATE.downInit(); // server ready (2/3)
  } catch {
    STATE.first = true;

    const ipcServerPath = resolve(context.extensionPath, "dist", "server.mjs");
    const errlogHandle = await open(logPath, "a");
    spawn(process.execPath, [...process.execArgv, ipcServerPath], {
      detached: true,
      shell: false,
      stdio: ["ignore", "ignore", errlogHandle.fd],
      env: {
        ...process.env,
        CM_PARENT_PID: process.pid.toString(),
        CM_SETTING_DIR: SETTING_DIR,
        CM_NATIVE_MODULE: NATIVE_MODULE,
        CM_VOLUME: context.globalState.get(VOLUME_KEY, 85).toString(),
        CM_SPEED: context.globalState.get(SPEED_KEY, 1).toString(),
      },
    }).unref();
    await errlogHandle.close();
    await IPC.connect(ipcHandler, ipcBHandler);
    STATE.master = true;
    STATE.downInit(); // server ready (2/3)
    readdir(SETTING_DIR, { withFileTypes: true })
      .then((dirents) =>
        dirents
          .filter((dirent) => dirent.isFile() && dirent.name.startsWith("err-") && dirent.name !== logFile)
          .map((dirent) => resolve(SETTING_DIR, dirent.name))
          .forEach((p) => void rm(p, { recursive: true, force: true }).catch(console.error)),
      )
      .catch(console.error);
  }
}
