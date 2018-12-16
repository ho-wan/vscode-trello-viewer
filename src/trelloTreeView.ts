import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TRELLO_ITEM_TYPE } from "./constants";

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;
  private trelloBoards: any;
  private onFirstLoad: boolean;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
    this.trelloBoards = {};
    this.onFirstLoad = true;
  }

  refresh(): void {
    console.log("🕐 refreshing");
    this.trello.getStarredBoards().then(boards => {
      this.trelloBoards = { boards };
      // console.log(this.trelloBoards);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    console.log("🌲 getting tree item");
    // console.log(element);
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<TrelloItem[]> {
    console.log("👶 getting children");
    // console.log(element);
    if (!element) {
      if (this.trelloBoards.boards === undefined || this.trelloBoards.boards.length == 0) {
        console.log("🤔 this.trelloBoards is null");
        // fetch boards from trello api on first load
        if (this.onFirstLoad) {
          this.onFirstLoad = false;
          this.refresh();
        }
        return Promise.resolve([]);
      }
      // add boards to tree view
      const trelloItemBoards = this.trelloBoards.boards.map((board: any) => {
        // console.log(board);
        const info = `URL: ${board.url}, Trello ${TRELLO_ITEM_TYPE.BOARD}, Name: ${board.name}, ID: ${board.id}`;
        return new TrelloItem(
          board.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          board.id,
          TRELLO_ITEM_TYPE.BOARD,
          `id: ${board.id}`,
          undefined,
          {
            command: "trelloViewer.showInfoMessage",
            title: "",
            arguments: [info],
          }
        );
      });
      console.log("😃 got boards for children");
      // console.log(boards);
      return Promise.resolve(trelloItemBoards);
    } else if (element.type === TRELLO_ITEM_TYPE.BOARD) {
      const boardId: string = element.id;
      const boardLists = this.trelloBoards[boardId];

      if (!boardLists) {
        console.log("🔷 getting lists");
        this.trello.getListsFromBoard(boardId).then(lists => {
          this.trelloBoards[boardId] = lists;
          // console.log(this.trelloBoards);
          this._onDidChangeTreeData.fire();
        });
      } else {
        const trelloItemLists = boardLists.map((list: any) => {
          // console.log(list);
          const info = `Trello ${TRELLO_ITEM_TYPE.LIST}, Name: ${list.name}, ID: ${list.id}, Board ID: ${boardId}`;
          return new TrelloItem(
            list.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            list.id,
            TRELLO_ITEM_TYPE.LIST,
            `id: ${list.id}`,
            boardId,
            {
              command: "trelloViewer.showInfoMessage",
              title: "",
              arguments: [info],
            }
          );
        });
        console.log(`😃 got lists from board ${boardId}`);
        return Promise.resolve(trelloItemLists);
      }
    } else if (element.type === TRELLO_ITEM_TYPE.LIST) {
      const boardId: string = element.parentId || "-1";
      const listId: string = element.id;
      const boardListCards = this.trelloBoards[boardId][listId];

      if (!boardListCards) {
        console.log(`🃏 getting cards for list ${listId}`);
        this.trello.getCardsFromList(listId).then(cards => {
          this.trelloBoards[boardId][listId] = cards;
          // console.log(this.trelloBoards);
          this._onDidChangeTreeData.fire();
        });
      } else {
        const trelloItemCards = boardListCards.map((card: any) => {
          // console.log(card);
          return new TrelloItem(
            card.name,
            vscode.TreeItemCollapsibleState.None,
            card.id,
            TRELLO_ITEM_TYPE.CARD,
            `id: ${card.id}`,
            listId,
            {
              command: "trelloViewer.showCard",
              title: "",
              arguments: [card],
            }
          );
        });
        console.log(`😃 got cards from list ${listId}`);
        return Promise.resolve(trelloItemCards);
      }
    }
    console.log("☹ no children");
    return Promise.resolve([]);
  }
}

export class TrelloItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly id: string,
    public readonly type: string,
    public readonly tooltip?: string,
    public readonly parentId?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  contextValue = `${this.type}`;
}
