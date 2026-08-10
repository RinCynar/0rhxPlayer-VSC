export * from "./shared.js";

import type { WorkspaceConfiguration } from "vscode";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { workspace } from "vscode";

export const CONF = (): WorkspaceConfiguration => workspace.getConfiguration("0rhxplayer");

const kConf = CONF();

export const SETTING_DIR = kConf.get<string | null>("cache.path") || resolve(homedir(), ".0rhx", "Player");
export const MUSIC_CACHE_DIR = resolve(SETTING_DIR, "cache", "music");

export const AUTO_START = kConf.get("host.autoStart", false);
export const QUEUE_INIT = kConf.get<"none" | "restore">("queue.initialization", "none");

export const BUTTON_KEY = "button-v2";
export const SPEED_KEY = "speed";
export const VOLUME_KEY = "volume";
export const LYRIC_KEY = "lyric-v3";
export const LOCAL_FOLDER_KEY = "local-folder-v2";
export const REPEAT_KEY = "repeat-v1";
export const SHOW_LYRIC_KEY = "show-lyric-v1";
