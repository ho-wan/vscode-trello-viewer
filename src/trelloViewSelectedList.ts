import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TrelloItem, TrelloItemType } from "./trelloTreeView";

export class TrelloViewSelectedList implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
  }

  refresh(): void {
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<any> {
    const card = new TrelloItem('placeholder', vscode.TreeItemCollapsibleState.None, "123", TrelloItemType.LIST);
    return Promise.resolve([card]);
  }
}
