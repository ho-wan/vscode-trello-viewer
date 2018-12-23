import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TrelloTreeView, TrelloItem } from "./trelloTreeView";
import { TrelloViewSelectedList } from "./trelloViewSelectedList";
import { TrelloCard, TrelloChecklist } from "./trelloComponents";

export function activate(context: vscode.ExtensionContext) {
  console.log('The extension "Trello Viewer" is now active!');
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
    ["trelloViewer.setSelectedListByClick", (trelloItem: TrelloItem) => trello.setSelectedListByClick(trelloItem)],
    ["trelloViewer.showCard", (card: TrelloCard, checklists: TrelloChecklist[]) => trello.showCard(card, checklists)],
  ];
  commandsToRegister.map((command: any) =>
    context.subscriptions.push(vscode.commands.registerCommand(command[0], command[1]))
  );
}

export function deactivate() {
  removeTempTrelloFile();
}
