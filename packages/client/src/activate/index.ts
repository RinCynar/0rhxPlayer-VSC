import { ArtworkViewProvider, LyricViewProvider } from "../utils/index.js";
import type { ExtensionContext } from "vscode";
import { initCommand } from "./command.js";
import { initIPC } from "./ipc.js";
import { initLocal } from "./local.js";
import { initQueue } from "./queue.js";
import { initStatusBar } from "./statusBar.js";
import { window } from "vscode";

export async function realActivate(context: ExtensionContext) {
  context.subscriptions.push(
    window.registerWebviewViewProvider("0rhxplayer-lyric", new LyricViewProvider(), {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    window.registerWebviewViewProvider("0rhxplayer-artwork", new ArtworkViewProvider(), {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );
  initQueue(context);
  initCommand(context);
  initStatusBar(context);
  await initIPC(context);
  await initLocal(context);
}
