import * as vscode from "vscode";
import { workspace, window } from 'vscode';
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');

  let API_KEY: string;
  let API_TOKEN: string;
  getTrelloToken();

  function getTrelloToken() {
    API_KEY = "7d1e3a411a1bf02d2ec0afb851d8e517";
    API_TOKEN = context.globalState.get("TRELLO_API_TOKEN") || "";
    console.log(`API token = ${API_TOKEN}`);
  }

  let setToken = vscode.commands.registerCommand("trello.setToken", () => {
    showInputBox("Enter API token")
      .then(token => {
        API_TOKEN = token || '';
        context.globalState.update("TRELLO_API_TOKEN", token);
      })
  });

  async function showInputBox(placeholderText : string) {
    return await vscode.window.showInputBox({placeHolder: placeholderText});
  }

  let getBoards = vscode.commands.registerCommand("trello.getBoards", () => {
    getTrelloToken();
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

  let showCardText = vscode.commands.registerTextEditorCommand('trello.showCardText', editor => {
    return workspace.openTextDocument('/Users/howant/_misc/training/vscode-trello/training-theodo/README.md')
      .then(doc => window.showTextDocument(doc, vscode.ViewColumn.Two, true));
	});

  context.subscriptions.push(setToken);
  context.subscriptions.push(getBoards);
  context.subscriptions.push(getCard);
  context.subscriptions.push(showCardText);
}

export function deactivate() {}
