import * as vscode from "vscode";
import { TrelloUtils, removeTempTrelloFile } from "./trello/TrelloUtils";
import { TrelloItem } from "./trello/TrelloItem";
import { TrelloTreeView } from "./trello/TrelloTreeView";
import { TrelloViewFavoriteList } from "./trello/TrelloViewFavoriteList";
import { TrelloCard } from "./trello/trelloComponents";

export function activate(context: vscode.ExtensionContext) {
  console.info('⭐ The extension "Trello Viewer" is now active!');

  const trello = new TrelloUtils(context);
  const trelloTreeView = new TrelloTreeView(trello);
  const trelloViewFavoriteList = new TrelloViewFavoriteList(trello);

  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider("trelloViewFavoriteList", trelloViewFavoriteList);

  const commandsToRegister: [string, Function][] = [
    ["trelloViewer.refresh", () => trelloTreeView.refresh()],
    ["trelloViewer.refreshFavoriteList", () => trelloViewFavoriteList.refresh()],
    ["trelloViewer.authenticate", () => trello.authenticate()],
    ["trelloViewer.setCredentials", () => trello.setCredentials()],
    ["trelloViewer.resetCredentials", () => trello.resetCredentials()],
    ["trelloViewer.showTrelloInfo", () => trello.showTrelloInfo()],
    ["trelloViewer.resetFavoriteList", () => trello.resetFavoriteList()],
    ["trelloViewer.setFavoriteListByClick", (trelloItem: TrelloItem) => trello.setFavoriteListByClick(trelloItem)],
    ["trelloViewer.showCard", (card: TrelloCard) => trello.showCard(card)],
  ];
  commandsToRegister.map((command: [string, any]) =>
    context.subscriptions.push(vscode.commands.registerCommand(command[0], command[1]))
  );
}

export function deactivate() {
  removeTempTrelloFile();
}
