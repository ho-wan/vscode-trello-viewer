import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TestView } from "./testView";
import { TrelloTreeView } from "./trelloTreeView";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');
  const trelloViewer = new TrelloComponent(context);
  const trelloTreeView = new TrelloTreeView(trelloViewer);
  vscode.window.registerTreeDataProvider("testView", new TestView());
  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);

  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.refresh", () => trelloTreeView.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.test", () => trelloViewer.getTrelloKeyToken()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.setKey", () => trelloViewer.setTrelloKey()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.setToken", () => trelloViewer.setTrelloToken()));
  context.subscriptions.push(vscode.commands.registerCommand("trelloViewer.showCard", card => trelloViewer.showCard(card)));
}

export function deactivate() {
  removeTempTrelloFile();
}
