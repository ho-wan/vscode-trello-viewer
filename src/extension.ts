"use strict";

import * as vscode from "vscode";
// @ts-ignore
import * as Trello from "trello";
// @ts-ignore
import * as keys from "./config/keys";
import * as trelloActions from "./trelloActions";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  let disposable = vscode.commands.registerCommand("trello.sayHello", () => {
    vscode.window.showInformationMessage(
      "Hello, this is the Trello extension!"
    );
  });

  let getCard = vscode.commands.registerCommand("trello.getCard", () => {
    let trello = new Trello(keys.my_API_key, keys.my_API_token);
    let cardsPromise = trello.getCardsOnList("5bccf456adf6930b49d0c468");
    // @ts-ignore
    cardsPromise.then(cards => {
      console.log(cards);
    });
  });

  let test = vscode.commands.registerCommand("trello.test", () => {
    const input = showInputBox();
    input.then(res => {
      // @ts-ignore
      console.log(res.toString());
    });
  });

  let login = vscode.commands.registerCommand(
    "trello.login",
    (request, response) => {
      try {
        console.log(`GET '/login' 🤠 ${Date()}`);
        trelloActions.login(request, response);
      } catch (err) {
        console.log(err);
      }
    }
  );

  let callback = vscode.commands.registerCommand(
    "trello.callback",
    (request, response) => {
      try {
        console.log(`GET '/callback' 🤠 ${Date()}`);
        trelloActions.callback(request, response);
      } catch (err) {
        console.log(err);
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(getCard);
  context.subscriptions.push(test);
  context.subscriptions.push(login);
  context.subscriptions.push(callback);
}

export function deactivate() {}

export async function showInputBox() {
  const result = await vscode.window.showInputBox({
    placeHolder: "Enter Trello API Token"
  });
  vscode.window.showInformationMessage(`Got: ${result}`);
  return result;
}
