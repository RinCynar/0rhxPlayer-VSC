import { ipcAppspace, ipcBroadcastServerId, ipcServerId } from "@0rhxplayer/shared";

export const ipcServerPath =
  process.platform === "win32" ? `\\\\.\\pipe\\tmp-${ipcAppspace}${ipcServerId}` : `/tmp/${ipcAppspace}${ipcServerId}`;

export const ipcBroadcastServerPath =
  process.platform === "win32"
    ? `\\\\.\\pipe\\tmp-${ipcAppspace}${ipcBroadcastServerId}`
    : `/tmp/${ipcAppspace}${ipcBroadcastServerId}`;

export const NATIVE_MODULE = `${process.platform}-${process.arch}.node`;
