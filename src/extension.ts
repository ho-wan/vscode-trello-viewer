"use strict";

import * as vscode from "vscode";
// @ts-ignore
import * as Trello from "trello";
// @ts-ignore
import * as keys from "./config/keys";
// import * as trelloActions from "./trelloActions";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');
  let trello: Trello;

  function setTrelloToken() {
    const API_KEY : string = keys.TRELLO_API_KEY;
    const API_TOKEN : string = context.globalState.get("TRELLO_API_TOKEN") || "";
    const trello = new Trello(API_KEY, API_TOKEN);
    vscode.window.showInformationMessage(
      `Token set: ${API_TOKEN.substr(0, 8)}...`
    );
    return trello;
  }

  trello = setTrelloToken();

  let disposable = vscode.commands.registerCommand("trello.sayHello", () => {
    vscode.window.showInformationMessage(
      "Hello, this is the Trello extension!"
    );
  });

  let getCard = vscode.commands.registerCommand("trello.getCard", () => {
    const cardsPromise = trello.getCardsOnList("5bccf456adf6930b49d0c468");
    cardsPromise
      .then((cards: object) => {
        console.log(cards);
      })
  });

  let login = vscode.commands.registerCommand("trello.login", () => {
    const inputToken = showInputBox();
    inputToken
      .then(token => {
        context.globalState.update("TRELLO_API_TOKEN", token);
      })
      .then(() => trello = setTrelloToken());
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(login);
  context.subscriptions.push(getCard);
}

export function deactivate() {}

export async function showInputBox() {
  const result = await vscode.window.showInputBox({
    placeHolder: "Enter Trello API Token"
  });
  return result;
}
