import { BUTTON_KEY, SETTING_DIR } from "./constant/index.js";
import { CONTEXT, IPC, STATE } from "./utils/index.js";
import type { ExtensionContext, TreeDataProvider, TreeView } from "vscode";
import { LocalProvider, QueueProvider, SongsProvider } from "./treeview/index.js";
import { window } from "vscode";
import { mkdir } from "node:fs/promises";
import { realActivate } from "./activate/index.js";

export async function activate(context: ExtensionContext): Promise<void> {
  CONTEXT.context = context;
  process.on("unhandledRejection", console.error);
  await mkdir(SETTING_DIR, { recursive: true }).catch();

  context.globalState.setKeysForSync([BUTTON_KEY]);

  console.log("0rhxplayer: native mode.");

  const createTreeView = <T>(viewId: string, treeDataProvider: TreeDataProvider<T> & { view: TreeView<T> }) => {
    const view = window.createTreeView(viewId, { treeDataProvider });
    treeDataProvider.view = view;
    return view;
  };

  const songs = createTreeView("0rhxplayer-songs", SongsProvider.getInstance());
  const queue = createTreeView("0rhxplayer-queue", QueueProvider.getInstance());
  const local = createTreeView("0rhxplayer-local", LocalProvider.getInstance());
  context.subscriptions.push(songs, queue, local);

  // Keep the Songs view in sync with the Library scan results.
  context.subscriptions.push(
    LocalProvider.getInstance().onDidChangeTreeData(() => SongsProvider.refresh()),
  );

  // Native player is always ready: signal the initialization (1/3).
  STATE.downInit();

  await realActivate(context);
}

export function deactivate(): Promise<void> {
  if (STATE.master) IPC.retain(QueueProvider.songs);
  // On windows, the data will be lost when the PIPE is closed.
  if (process.platform !== "win32") return Promise.resolve(IPC.disconnect());
  else return new Promise<void>((resolve) => setTimeout(() => resolve(IPC.disconnect()), 2048));
}
