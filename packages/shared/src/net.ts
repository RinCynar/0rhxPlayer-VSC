import type { IPCControl, IPCPlayer, IPCQueue } from "./event.js";
import type { NeteaseTypings } from "api";

export type IPCClientLoadMsg = {
  url?: string;
  item: NeteaseTypings.SongsItem;
  play: boolean;
  seek?: number;
};

export type IPCMsg<T = string, U = Record<never, never>> = { t: T } & U;

export type IPCBroadcastMsg =
  | IPCMsg<IPCPlayer.load>
  | IPCMsg<IPCPlayer.loaded>
  | IPCMsg<IPCPlayer.repeat, { r: boolean }>
  | IPCMsg<IPCQueue.add, { items: readonly unknown[]; index?: number }>
  | IPCMsg<IPCQueue.clear>
  | IPCMsg<IPCQueue.delete, { id: string | number }>
  | IPCMsg<IPCQueue.new, { items: readonly unknown[]; id: number }>
  | IPCMsg<IPCQueue.play, { id: string | number }>
  | IPCMsg<IPCQueue.shift, { index: number }>;

export type IPCClientMsg =
  | IPCMsg<IPCControl.retain, { items?: readonly unknown[] }>
  | IPCMsg<IPCPlayer.load, IPCClientLoadMsg>
  | IPCMsg<IPCPlayer.lyricDelay, { delay: number }>
  | IPCMsg<IPCPlayer.playing, { playing: boolean }>
  | IPCMsg<IPCPlayer.position, { pos: number }>
  | IPCMsg<IPCPlayer.stop>
  | IPCMsg<IPCPlayer.toggle>
  | IPCMsg<IPCPlayer.volume, { level: number }>
  | IPCMsg<IPCPlayer.speed, { speed: number }>
  | IPCMsg<IPCPlayer.seek, { seekOffset: number }>;

export type IPCServerMsg =
  | IPCMsg<IPCControl.master, { is?: true }>
  | IPCMsg<IPCControl.new>
  | IPCMsg<IPCControl.retain, { items: readonly unknown[]; play?: boolean; seek?: number }>
  | IPCMsg<
      IPCControl.current,
      {
        url: string;
        item: NeteaseTypings.SongsItem;
        pos: number;
        playing: boolean;
        lyric: NeteaseTypings.LyricData & { delay: number; idx: number };
      }
    >
  | IPCMsg<IPCPlayer.end, { fail?: true; pause?: boolean; reloadNseek?: number }>
  | IPCMsg<IPCPlayer.loaded>
  | IPCMsg<IPCPlayer.lyric, { lyric: NeteaseTypings.LyricData }>
  | IPCMsg<IPCPlayer.lyricIndex, { idx: number }>
  | IPCMsg<IPCPlayer.pause>
  | IPCMsg<IPCPlayer.play>
  | IPCMsg<IPCPlayer.stop>
  | IPCMsg<IPCPlayer.volume, { level: number }>
  | IPCMsg<IPCPlayer.next>
  | IPCMsg<IPCPlayer.previous>
  | IPCMsg<IPCPlayer.speed, { speed: number }>;
