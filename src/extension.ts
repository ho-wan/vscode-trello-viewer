import * as vscode from "vscode";
import { TrelloUtils, removeTempTrelloFile } from "./trello/TrelloUtils";
import { TrelloTreeView } from "./trello/TrelloTreeView";
import { TrelloViewFavoriteList } from "./trello/TrelloViewFavoriteList";
import { TrelloCard, TrelloList } from "./trello/trelloComponents";

export function activate(context: vscode.ExtensionContext) {
  const trello = new TrelloUtils(context);
  const trelloTreeView = new TrelloTreeView(trello);
  const trelloViewFavoriteList = new TrelloViewFavoriteList(trello);

  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider("trelloViewFavoriteList", trelloViewFavoriteList);

  vscode.commands.registerCommand("trelloViewer.refresh", () => trelloTreeView.refresh());
  vscode.commands.registerCommand("trelloViewer.refreshFavoriteList", () => trelloViewFavoriteList.refresh());
  vscode.commands.registerCommand("trelloViewer.authenticate", () => trello.authenticate());
  vscode.commands.registerCommand("trelloViewer.setCredentials", () => trello.setCredentials());
  vscode.commands.registerCommand("trelloViewer.resetCredentials", () => trello.resetCredentials());
  vscode.commands.registerCommand("trelloViewer.showTrelloInfo", () => trello.showTrelloInfo());
  vscode.commands.registerCommand("trelloViewer.resetFavoriteList", () => trello.resetFavoriteList());
  vscode.commands.registerCommand("trelloViewer.setFavoriteListByClick", (list: TrelloList) =>
    trello.setFavoriteListByClick(list)
  );

  vscode.commands.registerCommand("trelloViewer.addCard", (list: TrelloList) => trello.addCardToList(list));
  vscode.commands.registerCommand("trelloViewer.addUserToCard", (card: TrelloCard) => trello.addUserToCard(card));

  vscode.commands.registerCommand("trelloViewer.editCardDescription", (card: TrelloCard) =>
    trello.editDescription(card)
  );

  vscode.commands.registerCommand("trelloViewer.showCard", (card: TrelloCard) => trello.showCard(card));
}

export function deactivate() {
  removeTempTrelloFile();
}
