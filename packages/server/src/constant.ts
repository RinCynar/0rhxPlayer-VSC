import { ipcAppspace, ipcBroadcastServerId, ipcServerId } from "@0rhxplayer/shared";
import { homedir } from "node:os";
import { resolve } from "node:path";

export const ipcServerPath =
  process.platform === "win32" ? `\\\\.\\pipe\\tmp-${ipcAppspace}${ipcServerId}` : `/tmp/${ipcAppspace}${ipcServerId}`;

export const ipcBroadcastServerPath =
  process.platform === "win32"
    ? `\\\\.\\pipe\\tmp-${ipcAppspace}${ipcBroadcastServerId}`
    : `/tmp/${ipcAppspace}${ipcBroadcastServerId}`;

export const SETTING_DIR = process.env["CM_SETTING_DIR"] || resolve(homedir(), ".0rhx", "Player");

export const RETAIN_FILE = resolve(SETTING_DIR, "retain");
