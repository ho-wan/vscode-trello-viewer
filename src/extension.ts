import * as vscode from "vscode";
import * as fs from "fs";
import { UserDataFolder } from "./UserDataFolder";
import axios from "axios";

import {
  getTrelloKeyToken,
  setTrelloKey,
  setTrelloToken,
} from "./trelloUtils";

const tempTrelloFileName = '~vscodeTrello.md';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  let API_KEY: string;
  let API_TOKEN: string;
  [API_KEY, API_TOKEN] = getTrelloKeyToken(context.globalState);

  let test = vscode.commands.registerCommand("trello.test", () => {
    [API_KEY, API_TOKEN] = getTrelloKeyToken(context.globalState);
    console.log(`KEY = ${API_KEY}, TOKEN = ${API_TOKEN}`);
    vscode.window.showInformationMessage(`Getting Key and Token, KEY = ${API_KEY}`);
  });

  let setKey = vscode.commands.registerCommand("trello.setKey", () => {
    API_KEY = setTrelloKey(context.globalState);
  });

  let setToken = vscode.commands.registerCommand("trello.setToken", () => {
    API_TOKEN = setTrelloToken(context.globalState);
  });

  let getBoards = vscode.commands.registerCommand("trello.getBoards", () => {
    axios
      .get(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${API_TOKEN}`)
      .then(res => console.log(res))
      .catch(err => console.log(err.response));
  });

  let getCard = vscode.commands.registerCommand("trello.getCard", () => {
    axios
      .get(`https://api.trello.com/1/cards/5bd4c7061d87a7598e396abb?key=${API_KEY}&token=${API_TOKEN}`)
      .then(res => {
        console.log(res);
        vscode.window.showInformationMessage(res.data.desc);
      })
      .catch(err => console.log(err.response));
  });

  let showCardText = vscode.commands.registerTextEditorCommand('trello.showCardText', () => {
    const fileContent = 'Testing Trello Extension \n\n# Heading 1 #\n\n### Heading 3 ###\n\n---';

    // Get location of user's vs code folder to save temp markdown file
    const userDataFolder = new UserDataFolder();
    const tempTrelloFile = userDataFolder.getPathCodeSettings() + tempTrelloFileName;

    fs.writeFile(tempTrelloFile, fileContent, (err) => {
      if (err) {
        vscode.window.showErrorMessage("Error: unable to write to markdown file " + err);
      }
      console.log(`Writing to file: ${tempTrelloFile}`);
    });

    return vscode.workspace.openTextDocument(tempTrelloFile)
      .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, false))
      .then(() => vscode.commands.executeCommand('markdown.showPreview'))
	});

  context.subscriptions.push(test);
  context.subscriptions.push(setKey);
  context.subscriptions.push(setToken);
  context.subscriptions.push(getBoards);
  context.subscriptions.push(getCard);
  context.subscriptions.push(showCardText);
}

export function deactivate() {
  const userDataFolder = new UserDataFolder();
  const tempTrelloFile = userDataFolder.getPathCodeSettings() + tempTrelloFileName;

  fs.unlink(tempTrelloFile, (err) => {
    if (err) throw err;
    console.log(`Deleted file: ${tempTrelloFile}`);
  });
}
