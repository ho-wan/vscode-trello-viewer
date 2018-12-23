import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TRELLO_ITEM_TYPE } from "./constants";
import { TrelloObject, TrelloBoard, TrelloList, TrelloCard } from "./trelloComponents";

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
        return this.refreshOnFirstLoad(this.onFirstLoad);
      }
      const trelloItemBoards = this.getTreeElements(TRELLO_ITEM_TYPE.BOARD, this.trelloObject.trelloBoards);
      return Promise.resolve(trelloItemBoards);
    } else if (element.type === TRELLO_ITEM_TYPE.BOARD) {
      const boardId: string = element.id;
      const trelloBoard = this.trelloObject.trelloBoards.find((item: TrelloBoard) => item.id === boardId);
      if (!trelloBoard) {
        console.log(`❌ Error: trelloBoard id ${boardId} not found`);
        return Promise.resolve([]);
      }
      if (!trelloBoard.trelloLists) {
        this.fetchListsAndUpdate(boardId, trelloBoard);
      } else {
        const trelloItemLists = this.getTreeElements(TRELLO_ITEM_TYPE.LIST, trelloBoard.trelloLists, boardId);
        return Promise.resolve(trelloItemLists);
      }
    } else if (element.type === TRELLO_ITEM_TYPE.LIST) {
      const boardId: string = element.parentId || "-1";
      const listId: string = element.id;
      const trelloBoard = this.trelloObject.trelloBoards.find((item: TrelloBoard) => item.id === boardId);
      if (!trelloBoard) {
        console.log(`❌ Error: trelloBoard id ${boardId} not found`);
        return Promise.resolve([]);
      }
      const trelloList = trelloBoard.trelloLists.find((item: TrelloList) => item.id === listId);
      if (!trelloList) {
        console.log(`❌ Error: trelloList id ${listId} not found`);
        return Promise.resolve([]);
      }

      if (!trelloList.trelloCards) {
        this.fetchCardsAndUpdate(listId, trelloList);
      } else {
        const trelloItemCards = this.getTreeElements(TRELLO_ITEM_TYPE.CARD, trelloList.trelloCards, listId, true);
        return Promise.resolve(trelloItemCards);
      }
    }
    return Promise.resolve([]);
  }

  private refreshOnFirstLoad(onFirstLoad: boolean): Promise<TrelloItem[]> {
    console.log("🤔 this.trelloBoards is null");
    if (onFirstLoad) {
      onFirstLoad = false;
      this.refresh();
    }
    return Promise.resolve([]);
  }

  private async fetchListsAndUpdate(boardId: string, trelloBoard: TrelloBoard): Promise<void> {
    trelloBoard.trelloLists = await this.trello.getListsFromBoard(boardId);
    this._onDidChangeTreeData.fire();
  }

  private async fetchCardsAndUpdate(listId: string, trelloList: TrelloList): Promise<void> {
    trelloList.trelloCards = await this.trello.getCardsFromList(listId);
    trelloList.trelloCards.map(async (card: TrelloCard) => {
      card.trelloChecklists = await Promise.all(
        card.idChecklists.map((checklistId: string) => this.trello.getChecklistById(checklistId))
      );
    });
    this._onDidChangeTreeData.fire();
  }

  private getTreeElements(
    trelloItemType: string,
    trelloObjects: Array<TrelloBoard | TrelloList | TrelloCard>,
    parentId?: string,
    showCard?: boolean
  ) {
    return trelloObjects.map(obj => {
      return new TrelloItem(
        obj.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        obj.id,
        trelloItemType,
        `id: ${obj.id}`,
        parentId,
        showCard
          ? {
              command: "trelloViewer.showCard",
              title: "",
              // @ts-ignore#
              arguments: [obj, obj.trelloChecklists],
            }
          : undefined
      );
    });
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
