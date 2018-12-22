import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TRELLO_ITEM_TYPE } from "./constants";
import { ChecklistObject } from "./trelloComponents";

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
        return new TrelloItem(
          board.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          board.id,
          TRELLO_ITEM_TYPE.BOARD,
          `id: ${board.id}`,
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
          return new TrelloItem(
            list.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            list.id,
            TRELLO_ITEM_TYPE.LIST,
            `id: ${list.id}`,
            boardId,
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
          cards.map((card: any) => {
            // this.trelloBoards[boardId][listId][card.id] = card.idChecklists;
            card.idChecklists.map((checklistId: any) => {
              this.trello.getChecklistById(checklistId).then(checklist => {
                this.trelloBoards[boardId][listId][checklistId] = checklist;
                // console.log(this.trelloBoards[boardId][listId][checklistId]);
              });
            });
          });
          this._onDidChangeTreeData.fire();
        });
      } else {
        const trelloItemCards = boardListCards.map((card: any) => {
          // let checklists: Array<object> = [];
          let checklists: any = {};
          card.idChecklists.map((checklistId: any) => {
            checklists[checklistId] = this.trelloBoards[boardId][listId][checklistId];
            // checklists.push(this.trelloBoards[boardId][listId][checklistId].checkItems);
          });
          // console.log(checklists);
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
              arguments: [card, checklists],
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
