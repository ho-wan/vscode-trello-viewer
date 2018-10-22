"use strict";

import * as vscode from "vscode";
// @ts-ignore
import * as Trello from "trello";
// @ts-ignore
import * as keys from "./config/keys";
import { window } from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  let disposable = vscode.commands.registerCommand("trello.sayHello", () => {
    vscode.window.showInformationMessage(
      "Hello, this is the Trello extension!"
    );
    window.showInformationMessage(`KEY: ${process.env.KEY}`);
  });

  let getCard = vscode.commands.registerCommand("trello.getCard", () => {
    let trello = new Trello(keys.my_api_key, keys.my_api_token);

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
      process.env.KEY = res.toString();
      console.log(process.env.KEY);
    });
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(getCard);
  context.subscriptions.push(test);
}

export function deactivate() {}

export async function showInputBox() {
  const result = await window.showInputBox({
    placeHolder: "Enter Trello API Token"
  });
  window.showInformationMessage(`Got: ${result}`);
  return result;
}
