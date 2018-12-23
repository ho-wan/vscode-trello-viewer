import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TrelloItem } from "./trelloItem";
import { TRELLO_ITEM_TYPE } from "./constants";
import { TrelloObject, TrelloBoard, TrelloList, TrelloCard } from "./trelloComponents";

export class TrelloViewSelectedList implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;
  private selectedListObject: TrelloObject;
  private onFirstLoad: boolean;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
    this.selectedListObject = { trelloBoards: [] };
    this.onFirstLoad = true;
  }

  refresh(): void {
    console.log("🕐 refreshing selected list");
    if (!this.trello.getSelectedList()) {
      if (!this.onFirstLoad) {
        this.trello.showInfoMessage('Select a Favourite List ⭐ to view.');
      }
      return;
    }
    this.trello.getInitialSelectedList().then((list: TrelloList) => {
      this.trello.getBoardById(list.idBoard).then((board: any) => {
        this.selectedListObject = { trelloBoards: [board] };
        this.selectedListObject.trelloBoards[0].trelloLists = [list];
        this._onDidChangeTreeData.fire();
      });
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<any> {
    if (!element) {
      if (this.selectedListObject.trelloBoards.length == 0) {
        this.refreshOnFirstLoad();
      }

      return Promise.resolve(
        this.getTreeElements(
          TRELLO_ITEM_TYPE.BOARD,
          this.selectedListObject.trelloBoards,
          vscode.TreeItemCollapsibleState.Expanded
        )
      );
    } else if (element.type === TRELLO_ITEM_TYPE.BOARD) {
      return Promise.resolve(
        this.getTreeElements(
          TRELLO_ITEM_TYPE.LIST,
          this.selectedListObject.trelloBoards[0].trelloLists,
          vscode.TreeItemCollapsibleState.Expanded,
          element.id
        )
      );
    } else if (element.type === TRELLO_ITEM_TYPE.LIST) {
      const trelloList = this.selectedListObject.trelloBoards[0].trelloLists[0];
      if (!trelloList.trelloCards) {
        this.fetchCardsAndUpdate(trelloList.id, trelloList);
      } else {
        return Promise.resolve(
          this.getTreeElements(
            TRELLO_ITEM_TYPE.CARD,
            trelloList.trelloCards,
            vscode.TreeItemCollapsibleState.None,
            trelloList.id,
            true
          )
        );
      }
    }
    return Promise.resolve([]);
  }

  private refreshOnFirstLoad(): void {
    console.log("🤔 selectedListObject is null");
    if (this.onFirstLoad) {
      this.refresh();
      this.onFirstLoad = false;
    }
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
        obj.name,
        collapsed,
        obj.id,
        trelloItemType,
        `id: ${obj.id}`,
        parentId,
        showCard
          ? {
              command: "trelloViewer.showCard",
              title: "Show Trello Card",
              // @ts-ignore#
              arguments: [obj, obj.trelloChecklists],
            }
          : undefined
      );
    });
  }
}
