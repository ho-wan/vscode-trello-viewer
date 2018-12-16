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
    if (!element) {
      if (this.selectedList === undefined) {
        console.log("🤔 this.selectedList is undefined");
        // fetch boards from trello api on first load
        if (this.onFirstLoad) {
          this.onFirstLoad = false;
          this.refresh();
        }
        return Promise.resolve([]);
      }
      // add boards to tree view
      const list = new TrelloItem(this.selectedList.name, vscode.TreeItemCollapsibleState.Expanded, this.selectedList.id, TRELLO_ITEM_TYPE.LIST, `id: ${this.selectedList.id}`);
      console.log("😃 got list for children");
      // console.log(boards);
      return Promise.resolve([list]);
    }

  if (element.type === TRELLO_ITEM_TYPE.LIST) {
    const listId: string = element.id;
    const selectedListCards = this.selectedList[listId];

    if (!selectedListCards) {
      console.log(`🃏 getting cards for list ${listId}`);
      this.trello.getCardsFromList(listId).then(cards => {
        this.selectedList[listId] = cards;
        this._onDidChangeTreeData.fire();
      });
    } else {
      // console.log(selectedListCards);
      const cards = selectedListCards.map((card: any) => {
        return new TrelloItem(card.name, vscode.TreeItemCollapsibleState.None, card.id, TRELLO_ITEM_TYPE.CARD, `id: ${card.id}`, listId, {
          command: "trelloViewer.showCard",
          title: "",
          arguments: [card]
        });
      });
      console.log(`😃 got cards from list ${listId}`);
      return Promise.resolve(cards);
    }
  }

  console.log("☹ no children");
  return Promise.resolve([]);
  }
}
