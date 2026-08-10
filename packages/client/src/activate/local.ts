import type { LocalFileTreeItem, LocalLibraryTreeItem } from "../treeview/index.js";
import { Uri, commands, env, window } from "vscode";
import type { ExtensionContext } from "vscode";
import { IPC } from "../utils/index.js";
import { SETTING_DIR } from "../constant/index.js";
import { LocalProvider, SongItemTreeItem, SongsProvider } from "../treeview/index.js";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Local library folders are persisted under `~/.0rhx/Player`, not in VS Code's global state. */
const LIBRARIES_FILE = resolve(SETTING_DIR, "libraries.json");

async function readLibraries(): Promise<string[]> {
  try {
    const list: unknown = JSON.parse(await readFile(LIBRARIES_FILE, "utf8"));
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeLibraries(folders: readonly string[]): Promise<void> {
  try {
    await writeFile(LIBRARIES_FILE, JSON.stringify(folders), "utf8");
  } catch {}
}

export async function initLocal(context: ExtensionContext): Promise<void> {
  // Wait for every folder to be registered before scanning, otherwise the
  // eager scan would see an empty folder list and the Songs view stays empty.
  const folders = await readLibraries();
  await Promise.allSettled(folders.map((f) => LocalProvider.addFolder(f)));
  LocalProvider.refresh();
  // Scan every library folder eagerly so the Songs view is populated.
  void LocalProvider.scanAll();

  context.subscriptions.push(
    commands.registerCommand("0rhxplayer.newLocalLibrary", async () => {
      const path = (
        await window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false })
      )?.shift()?.fsPath;
      if (!path) return;
      const folders = await LocalProvider.addFolder(path);
      if (folders) {
        await writeLibraries(folders);
        void LocalProvider.scanAll();
      }
    }),

    commands.registerCommand("0rhxplayer.refreshLocalLibrary", () => LocalProvider.refresh()),

    commands.registerCommand("0rhxplayer.deleteLocalLibrary", ({ label }: LocalLibraryTreeItem) => {
      const folders = LocalProvider.deleteFolder(label);
      if (folders !== undefined) void writeLibraries(folders);
      void LocalProvider.scanAll();
    }),

    commands.registerCommand(
      "0rhxplayer.openLocalLibrary",
      ({ label }: LocalLibraryTreeItem) => void env.openExternal(Uri.file(label)),
    ),

    commands.registerCommand("0rhxplayer.playLocalLibrary", async (element: LocalLibraryTreeItem) => {
      const items = await LocalProvider.refreshLibrary(element);
      IPC.new(items);
    }),

    commands.registerCommand("0rhxplayer.addLocalLibrary", async (element: LocalLibraryTreeItem) => {
      const items = await LocalProvider.refreshLibrary(element);
      IPC.add(items);
    }),

    commands.registerCommand("0rhxplayer.refreshLocalFile", (element: LocalLibraryTreeItem) =>
      LocalProvider.refreshLibrary(element, true),
    ),

    commands.registerCommand("0rhxplayer.addLocalFile", ({ data }: LocalFileTreeItem) => IPC.add([data])),

    commands.registerCommand("0rhxplayer.playLocalFile", ({ data }: LocalFileTreeItem) => IPC.new([data])),

    commands.registerCommand("0rhxplayer.songPlay", ({ data }: SongItemTreeItem) => IPC.new([data])),

    commands.registerCommand("0rhxplayer.searchSongs", () => {
      const qp = window.createQuickPick();
      qp.title = "Search songs";
      qp.placeholder = "Search by title or artist";
      qp.value = SongsProvider.keyword;
      qp.onDidChangeValue((value) => SongsProvider.setKeyword(value.trim()));
      qp.onDidHide(() => qp.dispose());
      qp.show();
    }),

    commands.registerCommand("0rhxplayer.clearSongSearch", () => SongsProvider.setKeyword("")),
  );
}
