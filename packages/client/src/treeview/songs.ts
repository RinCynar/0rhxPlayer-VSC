import { EventEmitter, ThemeIcon, TreeItem, commands } from "vscode";
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
    // {TITLE} as label, {artist} as description (rendered smaller & dimmer by VS Code)
    super(data.name);
    this.id = data.abspath;
    this.description = data.ar.map(({ name }) => name).join("/");
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

  private static _keyword = "";

  readonly view!: TreeView<SongItemTreeItem>;

  _onDidChangeTreeData = new EventEmitter<void>();

  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  static getInstance(): SongsProvider {
    return this._instance || (this._instance = new SongsProvider());
  }

  static get keyword(): string {
    return this._keyword;
  }

  /** Filter the Songs view by a keyword (title / artist). */
  static setKeyword(keyword: string): void {
    if (this._keyword !== keyword) {
      this._keyword = keyword;
      void commands.executeCommand("setContext", "0rhxplayer.songSearching", keyword.length > 0);
      this.refresh();
    }
  }

  static refresh(): void {
    this._instance?._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SongItemTreeItem): SongItemTreeItem {
    return element;
  }

  getChildren(): SongItemTreeItem[] {
    const keyword = SongsProvider._keyword.trim().toLowerCase();
    return LocalProvider.allFiles
      .map(({ data }) => SongItemTreeItem.new(data))
      .filter((item) => {
        if (!keyword) return true;
        return (
          item.data.name.toLowerCase().includes(keyword) ||
          item.data.ar.some(({ name }) => name.toLowerCase().includes(keyword))
        );
      })
      .sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
  }
}
