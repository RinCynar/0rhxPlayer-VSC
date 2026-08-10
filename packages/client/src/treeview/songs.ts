import { EventEmitter, ThemeIcon, TreeItem } from "vscode";
import type { LocalFileTreeItemData } from "./local.js";
import { LocalProvider } from "./local.js";
import type { PlayTreeItem } from "./index.js";
import type { TreeDataProvider, TreeView } from "vscode";

export class SongItemTreeItem extends TreeItem implements PlayTreeItem {
  private static readonly _set = new Map<string, SongItemTreeItem>();

  override readonly iconPath = new ThemeIcon("file-media");

  override readonly contextValue = "SongItemTreeItem";

  declare readonly label: string;

  override readonly description: string;

  override readonly tooltip: string;

  override readonly command = {
    title: "Play",
    command: "0rhxplayer.songPlay",
    arguments: [this],
  };

  private constructor(readonly data: LocalFileTreeItemData) {
    // {title} - {artist}
    super(`${data.name} - ${data.ar.map(({ name }) => name).join("/")}`);
    this.description = data.al.name || "";
    this.tooltip = data.abspath;
  }

  override get valueOf(): string {
    return this.data.abspath;
  }

  static new(data: LocalFileTreeItemData): SongItemTreeItem {
    let element = this._set.get(data.abspath);
    if (element) return element;
    element = new this(data);
    this._set.set(data.abspath, element);
    return element;
  }
}

/** Aggregates every song scanned by the Library view, sorted by title. */
export class SongsProvider implements TreeDataProvider<SongItemTreeItem> {
  private static _instance: SongsProvider;

  readonly view!: TreeView<SongItemTreeItem>;

  _onDidChangeTreeData = new EventEmitter<void>();

  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  static getInstance(): SongsProvider {
    return this._instance || (this._instance = new SongsProvider());
  }

  static refresh(): void {
    this._instance?._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SongItemTreeItem): SongItemTreeItem {
    return element;
  }

  getChildren(): SongItemTreeItem[] {
    return LocalProvider.allFiles
      .map(({ data }) => SongItemTreeItem.new(data))
      .sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
  }
}
