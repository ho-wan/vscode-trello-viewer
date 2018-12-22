import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TrelloTreeView } from "./trelloTreeView";
import { TrelloViewSelectedList } from "./trelloViewSelectedList";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');
  const trello = new TrelloComponent(context);
  const trelloTreeView = new TrelloTreeView(trello);
  const trelloViewSelectedList = new TrelloViewSelectedList(trello);

  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider("trelloViewSelectedList", trelloViewSelectedList);

  const commandsToRegister: Array<[string, Function]> = [
    ["trelloViewer.refresh", () => trelloTreeView.refresh()],
    ["trelloViewer.refreshSelectedList", () => trelloViewSelectedList.refresh()],
    ["trelloViewer.setCredentials", () => trello.setCredentials()],
    ["trelloViewer.resetCredentials", () => trello.resetCredentials()],
    ["trelloViewer.showInfoMessage", (info: string) => trello.showInfoMessage(info)],
    ["trelloViewer.showTrelloInfo", () => trello.showTrelloInfo()],
    ["trelloViewer.setSelectedList", (listId: string) => trello.setSelectedList(listId)],
    ["trelloViewer.setSelectedListId", () => trello.setSelectedListId()],
    ["trelloViewer.setSelectedListByClick", (trelloItem: object) => trello.setSelectedListByClick(trelloItem)],
    ["trelloViewer.showCard", (card: object, checklists: object) => trello.showCard(card, checklists)],
  ];
  commandsToRegister.map((command: any) =>
    context.subscriptions.push(vscode.commands.registerCommand(command[0], command[1]))
  );
}

export function deactivate() {
  removeTempTrelloFile();
}
