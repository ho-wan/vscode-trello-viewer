import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TestView } from "./testView";

const tempTrelloFileName = '~vscodeTrello.md';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');
  // @ts-ignore
  const testView = new TestView(vscode.workspace.workspaceFolders[0].uri.fsPath);
  vscode.window.registerTreeDataProvider('testView', testView);

  const trello = new TrelloComponent(context);
  context.subscriptions.push(vscode.commands.registerCommand("trello.test", () => trello.getTrelloKeyToken()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.setKey", () => trello.setTrelloKey()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.setToken", () => trello.setTrelloToken()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.getBoards", () => trello.getTrelloBoards()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.getCard", () => trello.getTrelloCards()));
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('trello.showCard', () => {trello.showTrelloCard(tempTrelloFileName)})
  );
}

export function deactivate() {
  removeTempTrelloFile(tempTrelloFileName);
}
