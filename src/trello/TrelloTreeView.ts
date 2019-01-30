import * as vscode from "vscode";

import { TrelloUtils } from "./TrelloUtils";
import { TrelloItem } from "./TrelloItem";
import { TrelloObject, TrelloBoard, TrelloList, TrelloCard } from "./trelloComponents";

import { TRELLO_ITEM_TYPE, SETTING_PREFIX, SETTING_CONFIG } from "./constants";
import { prependToLabel } from "../common/utils";

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloUtils;
  private trelloObject: TrelloObject;
  private onFirstLoad: boolean;

  constructor(trello: TrelloUtils) {
    this.trello = trello;
    this.trelloObject = { trelloBoards: [] };
    this.onFirstLoad = true;
  }

  refresh(): void {
    if (!this.trello.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Missing Credentials: please provide API key and token to use.");
      this.trelloObject = { trelloBoards: [] };
      this._onDidChangeTreeData.fire();
      return;
    }
    const starredBoard: boolean | undefined = vscode.workspace
      .getConfiguration(SETTING_PREFIX, null)
      .get(SETTING_CONFIG.STARRED_BOARDS);
    this.trello.getBoards(starredBoard).then(boards => {
      this.trelloObject = { trelloBoards: boards };
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<TrelloItem[]> {
    if (!element) {
      if (!this.trelloObject.trelloBoards) {
        return Promise.resolve([]);
      }
      if (this.trelloObject.trelloBoards.length == 0) {
        this.refreshOnFirstLoad();
      }
      return Promise.resolve(
        this.getTreeElements(
          TRELLO_ITEM_TYPE.BOARD,
          this.trelloObject.trelloBoards,
          vscode.TreeItemCollapsibleState.Collapsed
        )
      );
    } else if (element.type === TRELLO_ITEM_TYPE.BOARD) {
      const boardId: string = element.id;
      const trelloBoard = this.trelloObject.trelloBoards.find((item: TrelloBoard) => item.id === boardId);
      if (!trelloBoard) {
        console.error(`Error: trelloBoard id ${boardId} not found`);
        return Promise.resolve([]);
      }
      if (!trelloBoard.trelloLists) {
        this.fetchListsAndUpdate(boardId, trelloBoard);
      } else {
        return Promise.resolve(
          this.getTreeElements(
            TRELLO_ITEM_TYPE.LIST,
            trelloBoard.trelloLists,
            vscode.TreeItemCollapsibleState.Collapsed,
            boardId
          )
        );
      }
    } else if (element.type === TRELLO_ITEM_TYPE.LIST) {
      const boardId: string = element.parentId || "-1";
      const listId: string = element.id;
      const trelloBoard = this.trelloObject.trelloBoards.find((item: TrelloBoard) => item.id === boardId);
      if (!trelloBoard) {
        console.error(`Error: trelloBoard id ${boardId} not found`);
        return Promise.resolve([]);
      }
      const trelloList = trelloBoard.trelloLists.find((item: TrelloList) => item.id === listId);
      if (!trelloList) {
        console.error(`Error: trelloList id ${listId} not found`);
        return Promise.resolve([]);
      }

      if (!trelloList.trelloCards) {
        this.fetchCardsAndUpdate(listId, trelloList);
      } else {
        return Promise.resolve(
          this.getTreeElements(
            TRELLO_ITEM_TYPE.CARD,
            trelloList.trelloCards,
            vscode.TreeItemCollapsibleState.None,
            listId,
            true
          )
        );
      }
    }
    return Promise.resolve([]);
  }

  private refreshOnFirstLoad(): void {
    if (this.onFirstLoad) {
      this.refresh();
      this.onFirstLoad = false;
    }
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
    collapsed: vscode.TreeItemCollapsibleState = 1,
    parentId?: string,
    showCard?: boolean
  ): TrelloItem[] {
    return trelloObjects.map(obj => {
      return new TrelloItem(
        prependToLabel(obj.name, obj.idShort),
        collapsed,
        obj.id,
        trelloItemType,
        `id: ${obj.id}`,
        parentId,
        showCard
          ? {
              command: "trelloViewer.showCard",
              title: "Show Trello Card",
              arguments: [obj],
            }
          : undefined
      );
    });
  }
}
