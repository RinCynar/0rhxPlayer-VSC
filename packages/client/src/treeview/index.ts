export * from "./local.js";
export * from "./queue.js";
export * from "./songs.js";

import type { LocalFileTreeItem, LocalFileTreeItemData, QueueItemTreeItem, QueueItemTreeItemData } from "./index.js";
import type { ThemeIcon, TreeItem } from "vscode";

export type QueueContent = QueueItemTreeItem | LocalFileTreeItem;

export type TreeItemId = "q" | "l";

export type PlayTreeItemData = LocalFileTreeItemData | QueueItemTreeItemData;

export interface PlayTreeItem extends TreeItem {
  readonly iconPath: ThemeIcon;
  readonly contextValue: string;
  readonly label: string;
  readonly description: string;
  readonly tooltip: string;
  readonly data: PlayTreeItemData;
  valueOf: number | string;
}
