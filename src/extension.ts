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
  // Tree views
  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider("trelloViewFavoriteList", trelloViewFavoriteList);
  // Refresh
  vscode.commands.registerCommand("trelloViewer.refresh", () => trelloTreeView.refresh());
  vscode.commands.registerCommand("trelloViewer.refreshFavoriteList", () => trelloViewFavoriteList.refresh());
  // Tree View Actions - buttons
  vscode.commands.registerCommand("trelloViewer.authenticate", () => trello.authenticate());
  vscode.commands.registerCommand("trelloViewer.resetCredentials", () => trello.resetCredentials());
  vscode.commands.registerCommand("trelloViewer.showTrelloInfo", () => trello.showTrelloInfo());
  vscode.commands.registerCommand("trelloViewer.resetFavoriteList", () => trello.resetFavoriteList());
  // Alternative way to set credentials
  vscode.commands.registerCommand("trelloViewer.setCredentials", () => trello.setCredentials());
  // List Actions - buttons
  vscode.commands.registerCommand("trelloViewer.setFavoriteListByClick", (list: TrelloItem) =>
    trello.setFavoriteListByClick(list)
  );
  vscode.commands.registerCommand("trelloViewer.addCard", (list: TrelloItem) => trello.addCardToList(list));
  // Card Actions - edit
  vscode.commands.registerCommand("trelloViewer.editCardTitle", (card: TrelloItem) => trello.editTitle(card));
  vscode.commands.registerCommand("trelloViewer.editCardDescription", (card: TrelloItem) =>
    trello.editDescription(card)
  );
  vscode.commands.registerCommand("trelloViewer.addComment", (card: TrelloItem) => trello.addComment(card));
  // Card Actions - user
  vscode.commands.registerCommand("trelloViewer.addSelfToCard", (card: TrelloItem) => trello.addSelfToCard(card));
  vscode.commands.registerCommand("trelloViewer.removeSelfFromCard", (card: TrelloItem) =>
    trello.removeSelfFromCard(card)
  );
  // Card Actions - card
  vscode.commands.registerCommand("trelloViewer.moveCardToList", (card: TrelloItem) => trello.moveCardToList(card));
  vscode.commands.registerCommand("trelloViewer.archiveCard", (card: TrelloItem) => trello.archiveCard(card));
  // Card - Show using markdown preview
  vscode.commands.registerCommand("trelloViewer.showCard", (card: TrelloCard) => trello.showCard(card));
}

export function deactivate() {
  removeTempTrelloFile();
}
