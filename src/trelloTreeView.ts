import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TRELLO_ITEM_TYPE } from "./constants";
import { TrelloObject, TrelloBoard, TrelloList, TrelloCard, TrelloChecklist } from "./trelloComponents";

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;
  private trelloObject: TrelloObject;
  private onFirstLoad: boolean;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
    this.trelloObject = { trelloBoards: [] };
    this.onFirstLoad = true;
  }

  refresh(): void {
    console.log("🕐 refreshing");
    this.trello.getStarredBoards().then(boards => {
      this.trelloObject = { trelloBoards: boards };
      // console.log(this.trelloObject);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<TrelloItem[]> {
    if (!element) {
      if (this.trelloObject.trelloBoards === undefined || this.trelloObject.trelloBoards.length == 0) {
        console.log("🤔 this.trelloBoards is null");
        // fetch boards from trello api on first load
        if (this.onFirstLoad) {
          this.onFirstLoad = false;
          this.refresh();
        }
        return Promise.resolve([]);
      }
      // add boards to tree view
      const trelloItemBoards = this.trelloObject.trelloBoards.map((board: TrelloBoard) => {
        return new TrelloItem(
          board.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          board.id,
          TRELLO_ITEM_TYPE.BOARD,
          `id: ${board.id}`
        );
      });
      return Promise.resolve(trelloItemBoards);
    } else if (element.type === TRELLO_ITEM_TYPE.BOARD) {
      const boardId: string = element.id;
      const trelloBoard = this.trelloObject.trelloBoards.find((item: TrelloBoard) => item.id === boardId);
      if (!trelloBoard) {
        console.log(`❌ Error: trelloBoard id ${boardId} not found`);
        return Promise.resolve([]);
      }
      if (!trelloBoard.trelloLists) {
        console.log(`🔷 getting lists ${boardId}`);
        this.trello.getListsFromBoard(boardId).then(lists => {
          trelloBoard.trelloLists = lists;
          this._onDidChangeTreeData.fire();
        });
      } else {
        const trelloItemLists = trelloBoard.trelloLists.map((list: TrelloList) => {
          return new TrelloItem(
            list.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            list.id,
            TRELLO_ITEM_TYPE.LIST,
            `id: ${list.id}`,
            boardId
          );
        });
        console.log(`😃 got lists from board ${boardId}`);
        // console.log(this.trelloObject);
        return Promise.resolve(trelloItemLists);
      }
    } else if (element.type === TRELLO_ITEM_TYPE.LIST) {
      const boardId: string = element.parentId || "-1";
      const listId: string = element.id;
      const trelloBoard: TrelloBoard | undefined= this.trelloObject.trelloBoards.find((item: TrelloBoard) => item.id === boardId);
      if (!trelloBoard) {
        console.log(`❌ Error: trelloBoard id ${boardId} not found`);
        return Promise.resolve([]);
      }
      const trelloList: TrelloList | undefined = trelloBoard.trelloLists.find((item: TrelloList) => item.id === listId);
      if (!trelloList) {
        console.log(`❌ Error: trelloList id ${listId} not found`);
        return Promise.resolve([]);
      }

      if (!trelloList.trelloCards) {
        console.log(`🃏 getting cards for list ${listId}`);
        this.trello.getCardsFromList(listId).then(cards => {
          trelloList.trelloCards = cards;
          cards.map((card: TrelloCard) => {
            Promise.all(card.idChecklists.map((checklistId: string) => this.trello.getChecklistById(checklistId))).then(
              (checklists: TrelloChecklist[]) => {
                card.trelloChecklists = checklists;
              }
            );
          });
          this._onDidChangeTreeData.fire();
        });
      } else {
        const trelloItemCards = trelloList.trelloCards.map((card: TrelloCard) => {
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
              arguments: [card, card.trelloChecklists],
            }
          );
        });
        console.log(`😃 got cards from list ${listId}`);
        // console.log(this.trelloObject);
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
