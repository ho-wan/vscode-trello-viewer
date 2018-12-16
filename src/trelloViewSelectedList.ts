import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TrelloItem, TrelloItemType } from "./trelloTreeView";

export class TrelloViewSelectedList implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;
	private selectedList: any;
  private onFirstLoad: boolean;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
    this.onFirstLoad = true;
  }

  refresh(): void {
    console.log("🕐 refreshing selected list");
    this.trello.getInitialSelectedList().then(list => {
      this.selectedList = list;
      // console.log(this.selectedList);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<any> {
    // if (!element) {
    //   if (this.selectedList === undefined) {
		// 		console.log("🤔 this.trelloBoards is undefined");
		// 		// fetch boards from trello api on first load
    //     if (this.onFirstLoad) {
    //       this.onFirstLoad = false;
    //       this.refresh();
    //     }
    //     return Promise.resolve([]);
		// 	}
		// 	// add boards to tree view
    //   const boards = this.trelloBoards.boards.map((board: any) => {
		// 		// console.log(board);
    //     return new TrelloItem(board.name, vscode.TreeItemCollapsibleState.Collapsed, board.id, TrelloItemType.BOARD, `id: ${board.id}`);
    //   });
    //   console.log("😃 got boards for children");
    //   // console.log(boards);
    //   return Promise.resolve(boards);
		// }

    const card = new TrelloItem('placeholder', vscode.TreeItemCollapsibleState.None, "123", TrelloItemType.LIST);
    return Promise.resolve([card]);
  }
}
