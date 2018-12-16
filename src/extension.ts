import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TestView } from "./testView";
import { TrelloTreeView } from "./trelloTreeView";
import { TrelloViewSelectedList } from "./trelloViewSelectedList";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');
  const trello = new TrelloComponent(context);
  const trelloTreeView = new TrelloTreeView(trello);
  const trelloViewSelectedList = new TrelloViewSelectedList(trello);
  vscode.window.registerTreeDataProvider("testView", new TestView());
  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);
  vscode.window.registerTreeDataProvider("trelloViewSelectedList", trelloViewSelectedList);

  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.refresh", () => trelloTreeView.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.refreshSelectedList", () => trelloViewSelectedList.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.showTrelloInfo", () => trello.showTrelloInfo()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.resetCredentials", () => trello.resetCredentials()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.setCredentials", () => trello.setCredentials()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.setSelectedList", listId => trello.setSelectedList(listId)));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.setSelectedListId", () => trello.setSelectedListId()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.setSelectedListByClick", trelloItem => trello.setSelectedListByClick(trelloItem)));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.showCard", card => trello.showCard(card)));
}

export function deactivate() {
  removeTempTrelloFile();
}
