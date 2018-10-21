"use strict";

import * as vscode from "vscode";
import * as Trello from "trello";
import * as keys from "./config/keys";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  let disposable = vscode.commands.registerCommand("trello.sayHello", () => {
    vscode.window.showInformationMessage(
      "Hello, this is the Trello extension!"
    );
  });

  let getCard = vscode.commands.registerCommand("trello.getCard", () => {
    let trello = new Trello(keys.my_api_key, keys.my_api_token);

    let cardsPromise = trello.getCardsOnList("5bccf456adf6930b49d0c468");
    cardsPromise.then(cards => {
      console.log(cards);
    });
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(getCard);
}

export function deactivate() {}
