import * as vscode from "vscode";
import { TrelloUtils, removeTempTrelloFile } from "./trello/TrelloUtils";
import { TrelloTreeView } from "./trello/TrelloTreeView";
import { TrelloViewFavoriteList } from "./trello/TrelloViewFavoriteList";
import { TrelloCard } from "./trello/trelloComponents";
import { TrelloItem } from "./trello/TrelloItem";

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
  vscode.commands.registerCommand("trelloViewer.setFavoriteListByClick", (list: TrelloItem) =>
    trello.setFavoriteListByClick(list)
  );

  vscode.commands.registerCommand("trelloViewer.addCard", (list: TrelloItem) => trello.addCardToList(list));
  vscode.commands.registerCommand("trelloViewer.archiveCard", (card: TrelloItem) => trello.archiveCard(card));
  vscode.commands.registerCommand("trelloViewer.addComment", (card: TrelloItem) => trello.addComment(card));
  vscode.commands.registerCommand("trelloViewer.addUserToCard", (card: TrelloItem) => trello.addUserToCard(card));
  vscode.commands.registerCommand("trelloViewer.removeUserFromCard", (card: TrelloItem) =>
    trello.removeUserFromCard(card)
  );

  vscode.commands.registerCommand("trelloViewer.editCardTitle", (card: TrelloItem) =>
    trello.editTitle(card)
  );
  vscode.commands.registerCommand("trelloViewer.editCardDescription", (card: TrelloItem) =>
    trello.editDescription(card)
  );

  vscode.commands.registerCommand("trelloViewer.showCard", (card: TrelloCard) => trello.showCard(card));
}

export function deactivate() {
  removeTempTrelloFile();
}
