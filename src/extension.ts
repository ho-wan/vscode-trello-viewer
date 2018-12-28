import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TrelloItem } from "./trelloItem";
import { TrelloTreeView } from "./trelloTreeView";
import { TrelloViewFavoriteList } from "./trelloViewFavoriteList";
import { TrelloCard } from "./trelloComponents";

export function activate(context: vscode.ExtensionContext) {
  console.info('👍 The extension "Trello Viewer" is now active!');
  const trello = new TrelloComponent(context);
  const trelloTreeView = new TrelloTreeView(trello);
  const trelloViewFavoriteList = new TrelloViewFavoriteList(trello);

  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider("trelloViewFavoriteList", trelloViewFavoriteList);

  const commandsToRegister: Array<[string, Function]> = [
    ["trelloViewer.refresh", () => trelloTreeView.refresh()],
    ["trelloViewer.refreshFavoriteList", () => trelloViewFavoriteList.refresh()],
    ["trelloViewer.setCredentials", () => trello.setCredentials()],
    ["trelloViewer.resetCredentials", () => trello.resetCredentials()],
    ["trelloViewer.showInfoMessage", (info: string) => trello.showInfoMessage(info)],
    ["trelloViewer.showTrelloInfo", () => trello.showTrelloInfo()],
    ["trelloViewer.setFavoriteList", (listId: string) => trello.setFavoriteList(listId)],
    ["trelloViewer.setFavoriteListByClick", (trelloItem: TrelloItem) => trello.setFavoriteListByClick(trelloItem)],
    ["trelloViewer.showCard", (card: TrelloCard) => trello.showCard(card)],
  ];
  commandsToRegister.map((command: any) =>
    context.subscriptions.push(vscode.commands.registerCommand(command[0], command[1]))
  );
}

export function deactivate() {
  removeTempTrelloFile();
}
