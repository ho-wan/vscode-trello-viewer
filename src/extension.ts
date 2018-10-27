"use strict";

import * as vscode from "vscode";
import axios from "axios";
// @ts-ignore
import * as Trello from "trello";
// @ts-ignore
import * as keys from "./config/keys";
// import * as trelloActions from "./trelloActions";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  let API_KEY: string;
  let API_TOKEN: string;

  function setTrelloToken() {
    API_KEY = keys.TRELLO_API_KEY;
    API_TOKEN = context.globalState.get("TRELLO_API_TOKEN") || "";
    const trello = new Trello(API_KEY, API_TOKEN);
    vscode.window.showInformationMessage(
      `Token set: ${API_TOKEN.substr(0, 8)}...`
    );
    return trello;
  }

  let trello: Trello = setTrelloToken();

  let login = vscode.commands.registerCommand("trello.login", () => {
    const inputToken = showInputBox();
    inputToken
      .then(token => {
        if (token) {
          context.globalState.update("TRELLO_API_TOKEN", token);
        }
      })
      .then(() => (trello = setTrelloToken()));
  });

  let getCard = vscode.commands.registerCommand("trello.getCard", () => {
    const cardsPromise = trello.getCardsOnList("5bccf456adf6930b49d0c468");
    cardsPromise.then((cards: object) => {
      console.log(cards);
    });
  });

  let getBoards = vscode.commands.registerCommand("trello.getBoards", () => {});

  let getLists = vscode.commands.registerCommand("trello.getLists", () => {});

  let getCards = vscode.commands.registerCommand("trello.getCards", () => {
    axios
      .get(
        `https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${API_TOKEN}`
      )
      .then(res => console.log(res));
  });

  let disposable = vscode.commands.registerCommand("trello.sayHello", () => {
    vscode.window.showInformationMessage(
      "Hello, this is the Trello extension!"
    );
  });

  context.subscriptions.push(login);
  context.subscriptions.push(getCard);
  context.subscriptions.push(getBoards);
  context.subscriptions.push(getLists);
  context.subscriptions.push(getCards);
  context.subscriptions.push(disposable);
}

export function deactivate() {}

export async function showInputBox() {
  const result = await vscode.window.showInputBox({
    placeHolder: "Enter Trello API Token"
  });
  return result;
}
