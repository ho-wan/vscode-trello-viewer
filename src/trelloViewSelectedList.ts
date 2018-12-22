import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";
import { TrelloItem } from "./trelloTreeView";
import { TRELLO_ITEM_TYPE } from "./constants";

export class TrelloViewSelectedList implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;
  private selectedList: any;
  private selectedListParentBoard: any;
  private onFirstLoad: boolean;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
    this.onFirstLoad = true;
  }

  refresh(): void {
    console.log("🕐 refreshing selected list");
    this.trello.getInitialSelectedList().then(list => {
      this.selectedList = list;
      if (this.selectedList.idBoard) {
        this.trello.getBoardById(this.selectedList.idBoard).then((board: any) => {
          // console.log(board);
          this.selectedListParentBoard = board;
          this._onDidChangeTreeData.fire();
        });
      } else {
        // console.log(this.selectedList);
        this._onDidChangeTreeData.fire();
      }
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    console.log("🌲 getting tree item");
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<any> {
    if (!element) {
      if (this.selectedList === undefined) {
        console.log("🤔 this.selectedList is undefined");
        // fetch list from trello api on first load
        if (this.onFirstLoad) {
          this.onFirstLoad = false;
          this.refresh();
        }
        return Promise.resolve([]);
      }

      const board = this.selectedListParentBoard;
      if (board) {
        // add board to tree view
        const info = `URL: ${board.url}, Trello ${TRELLO_ITEM_TYPE.BOARD}, Name: ${board.name}, ID: ${board.id}`;
        const trelloItemBoard = new TrelloItem(
          board.name,
          vscode.TreeItemCollapsibleState.Expanded,
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
        return Promise.resolve([trelloItemBoard]);
      }
      console.log("🤔 unable to get parent board of selected list");
      return Promise.resolve([]);
    } else if (element.type === TRELLO_ITEM_TYPE.BOARD) {
      // add list to tree view
      const list = this.selectedList;
      const info = `Trello ${TRELLO_ITEM_TYPE.LIST}, Name: ${list.name}, ID: ${list.id}, Board ID: ${list.idBoard}`;
      const trelloItemList = new TrelloItem(
        list.name,
        vscode.TreeItemCollapsibleState.Expanded,
        list.id,
        TRELLO_ITEM_TYPE.LIST,
        `id: ${list.id}`,
        list.idBoard,
        {
          command: "trelloViewer.showInfoMessage",
          title: "",
          arguments: [info],
        }
      );
      console.log("😃 got list for children");
      // console.log(boards);
      return Promise.resolve([trelloItemList]);
    } else if (element.type === TRELLO_ITEM_TYPE.LIST) {
      // add cards to tree view
      const listId: string = element.id;
      const selectedListCards = this.selectedList[listId];
      this.getParent(element);

      if (!selectedListCards) {
        console.log(`🃏 getting cards for list ${listId}`);
        this.trello.getCardsFromList(listId).then(cards => {
          this.selectedList[listId] = cards;
          this._onDidChangeTreeData.fire();
        });
      } else {
        // console.log(selectedListCards);
        const cards = selectedListCards.map((card: any) => {
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
        return Promise.resolve(cards);
      }
    }

    console.log("☹ no children");
    return Promise.resolve([]);
  }

  getParent(element?: TrelloItem): Thenable<any> {
    if (!element) {
      console.error('Error: cannot find parent of selected list');
      return Promise.resolve([]);
    };
    const board = new TrelloItem(
      'parent',
      vscode.TreeItemCollapsibleState.None,
      element.id,
      TRELLO_ITEM_TYPE.CARD,
      `id: ${element.id}`,
    );
    // console.log(board);

    return Promise.resolve([board]);
  }
}
