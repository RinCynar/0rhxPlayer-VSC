import { BUTTON_MANAGER } from "../manager/index.js";
import { ArtworkViewProvider, IPC } from "./index.js";
import { LYRIC_KEY, QUEUE_INIT, REPEAT_KEY, SHOW_LYRIC_KEY } from "../constant/index.js";
import { LocalFileTreeItem, QueueProvider } from "../treeview/index.js";
import type { ExtensionContext } from "vscode";
import type { NeteaseTypings } from "api";
import type { QueueContent } from "../treeview/index.js";
import i18n from "../i18n/index.js";
import { parseFile } from "music-metadata";

export const enum LyricType {
  ori = 0, // original
  tra = 1, // translation
  rom = 2, // romanization
}

type Lyric = {
  type: LyricType;
} & NeteaseTypings.LyricData;

export const defaultLyric: Lyric = { type: LyricType.ori, time: [0], text: [["~", "~", "~"]], user: [] };

export const CONTEXT = <{ context: ExtensionContext }>{};

class State {
  // 100% local player: native decoding only, no WASM/account webview.
  wasm = false;

  first = false;

  // To finish initialization needs 2 steps
  // 1. Started the IPC server / Received the queue
  // 2. Native player is ready
  #initializing = 2;

  #master = false;

  #repeat = false;

  #playItem?: QueueContent;

  #showLyric = false;

  #lyric: Lyric = defaultLyric;

  get master(): boolean {
    return this.#master;
  }

  get repeat(): boolean {
    return this.#repeat;
  }

  get playItem(): QueueContent | undefined {
    return this.#playItem;
  }

  get showLyric(): boolean {
    return this.#showLyric;
  }

  get lyric(): Lyric {
    return this.#lyric;
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set master(value: boolean) {
    if (this.#master !== value) {
      this.#master = value;
    }
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set repeat(value: boolean) {
    this.#repeat = value;
    BUTTON_MANAGER.buttonRepeat(value);
    if (this.#master) void CONTEXT.context.globalState.update(REPEAT_KEY, value);
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set playItem(value: QueueContent | undefined) {
    if (value !== this.#playItem) {
      this.#setPlayItem(value);
      if (this.#master) value ? IPC.load() : IPC.stop();
    }
  }

  set loading(value: boolean) {
    BUTTON_MANAGER.buttonSong(value ? `$(loading~spin) ${i18n.word.song}: ${i18n.word.loading}` : this.#playItem);
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set showLyric(value: boolean) {
    this.#showLyric = value;
    void CONTEXT.context.globalState.update(SHOW_LYRIC_KEY, value);
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set lyric(value: Lyric) {
    this.#lyric = value;
    BUTTON_MANAGER.buttonLyric();
    if (this.#master) void CONTEXT.context.globalState.update(LYRIC_KEY, value);
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  #initPlay?: boolean;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  #initSeek?: number;

  downInit(play?: boolean, seek?: number) {
    if (play !== undefined) this.#initPlay = play;
    if (seek !== undefined) this.#initSeek = seek;

    if (this.#initializing <= -1) return;
    --this.#initializing;
    if (this.#initializing > 0) return;

    if (this.#initializing === 0) {
      if (!this.first) {
        --this.#initializing;
        return void this.#downInit();
      }

      switch (QUEUE_INIT) {
        case "none":
          return IPC.new([]);
        case "restore":
          return IPC.retain();
      }
    } else void this.#downInit();
  }

  #setPlayItem(value?: QueueContent) {
    this.#playItem = value;
    // Update the Artwork view from the cover embedded in the local audio file.
    if (value instanceof LocalFileTreeItem) {
      parseFile(value.data.abspath)
        .then(({ common: { picture } }) => {
          if (picture?.length) {
            const [{ data, format }] = picture;
            ArtworkViewProvider.artwork(`data:${format};base64,${data.toString("base64")}`);
          } else ArtworkViewProvider.artwork();
        })
        .catch(() => ArtworkViewProvider.artwork());
    } else ArtworkViewProvider.artwork();
  }

  async #downInit(): Promise<void> {
    this.repeat = CONTEXT.context.globalState.get(REPEAT_KEY, false);

    this.#setPlayItem(QueueProvider.head);

    if (this.#master) {
      const play = this.#initPlay ?? false;
      IPC.load(play, this.#initSeek);
      BUTTON_MANAGER.buttonPlay(play);
    }
    BUTTON_MANAGER.buttonSong(this.#playItem);

    this.#showLyric = CONTEXT.context.globalState.get(SHOW_LYRIC_KEY, false);

    this.#lyric = CONTEXT.context.globalState.get(LYRIC_KEY, defaultLyric);

    CONTEXT.context.subscriptions.push(
      QueueProvider.getInstance().onDidChangeTreeData(() => {
        this.playItem = QueueProvider.head;
      }),
    );
  }
}

export const STATE = new State();
