import * as vscode from "vscode";

export function getTrelloKeyToken(globalState: any) {
  const API_KEY = globalState.get("TRELLO_API_KEY") || "";
  const API_TOKEN = globalState.get("TRELLO_API_TOKEN") || "";
  return [API_KEY, API_TOKEN];
}

export function setTrelloKey(globalState: any) {
  const placeholderText = "Enter API key";
  vscode.window.showInputBox({placeHolder: placeholderText})
    .then(key => {
      if (key) {
        globalState.update("TRELLO_API_KEY", key);
        return key;
      } else {
        return globalState.get("TRELLO_API_KEY") || "";
      }
    });

  return '-1';
}

export function setTrelloToken(globalState: any) {
  const placeholderText = "Enter API key";
  vscode.window.showInputBox({placeHolder: placeholderText})
    .then(token => {
      if (token) {
        globalState.update("TRELLO_API_TOKEN", token);
        return token;
      } else {
        return globalState.get("TRELLO_API_TOKEN") || "";
      }
    });

  return '-1';
}

