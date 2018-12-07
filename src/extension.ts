import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";

const tempTrelloFileName = '~vscodeTrello.md';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  const trello = new TrelloComponent(context);
  let test = vscode.commands.registerCommand("trello.test", () => trello.getTrelloKeyToken());
  let setKey = vscode.commands.registerCommand("trello.setKey", () => trello.setTrelloKey());
  let setToken = vscode.commands.registerCommand("trello.setToken", () => trello.setTrelloToken());
  let getBoards = vscode.commands.registerCommand("trello.getBoards", () => trello.getTrelloBoards());
  let getCard = vscode.commands.registerCommand("trello.getCard", () => trello.getTrelloCards());
  let showCard = vscode.commands.registerTextEditorCommand('trello.showCard', () => {
    trello.showTrelloCard(tempTrelloFileName)
  });

  context.subscriptions.push(test);
  context.subscriptions.push(setKey);
  context.subscriptions.push(setToken);
  context.subscriptions.push(getBoards);
  context.subscriptions.push(getCard);
  context.subscriptions.push(showCard);
}

export function deactivate() {
  removeTempTrelloFile(tempTrelloFileName);
}
