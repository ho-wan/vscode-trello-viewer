import * as vscode from "vscode";
import * as fs from "fs";
import axios from "axios";
import { UserDataFolder } from "./UserDataFolder";

export class TrelloComponent {
  private globalState: any;
  private API_KEY: string;
  private API_TOKEN: string;

  private selectedCardName: string | undefined;
  private selectedCardDesc: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.globalState = context.globalState;
    this.API_KEY = this.getTrelloKey();
    this.API_TOKEN = this.getTrelloToken();
  }

  private getTrelloKey(): string {
    return this.globalState.get("TRELLO_API_KEY") || "";
  }

  private getTrelloToken(): string {
    return this.globalState.get("TRELLO_API_TOKEN") || "";
  }

  getTrelloKeyToken(): void {
    this.API_KEY = this.getTrelloKey();
    this.API_TOKEN = this.getTrelloToken();
    vscode.window.showInformationMessage('Test', `Got API key: ${this.API_KEY}`, `API token: ${this.API_TOKEN}`);
  }

  setTrelloKey(): void {
    vscode.window.showInputBox({placeHolder: "Enter API key"})
      .then(key => {
        if (key) {
          this.API_KEY = key;
          this.globalState.update("TRELLO_API_KEY", key);
        };
      });
  }

  setTrelloToken(): void {
    vscode.window.showInputBox({placeHolder: "Enter API token"})
      .then(token => {
        if (token) {
          this.API_TOKEN = token;
          this.globalState.update("TRELLO_API_TOKEN", token);
        };
      });
  }

  getTrelloBoards(): void {
    axios
      .get(`https://api.trello.com/1/members/me/boards?key=${this.API_KEY}&token=${this.API_TOKEN}`)
      .then(res => {
        vscode.window.showInformationMessage('Boards', res.data.map((board: any) => board.name).join(", "));
        console.log(res);
      })
      .catch(err => console.log(err.response));
  }

  getTrelloCards(): void {
    axios
      .get(`https://api.trello.com/1/cards/5bd4c7061d87a7598e396abb?key=${this.API_KEY}&token=${this.API_TOKEN}`)
      .then(res => {
        console.log(res);
        this.selectedCardName = res.data.name;
        this.selectedCardDesc = res.data.desc;
        vscode.window.showInformationMessage(`Got card: ${this.selectedCardName}`);
      })
      .catch(err => console.log(err.response));
  };

  showTrelloCard(tempTrelloFileName: string): void {
    const fileHeader = this.selectedCardName || '## No card name found ##';
    const fileBody = this.selectedCardDesc || '## No card description found ##';
    const fileContent = `**TITLE**\n\n${fileHeader}\n\n-----\n\n**DESCRIPTION**\n\n${fileBody}`;

    // Get location of user's vs code folder to save temp markdown file
    const userDataFolder = new UserDataFolder();
    const tempTrelloFile = userDataFolder.getPathCodeSettings() + tempTrelloFileName;

    fs.writeFile(tempTrelloFile, fileContent, (err) => {
      if (err) {
        vscode.window.showErrorMessage("Error: unable to write to markdown file " + err);
      }
      console.log(`Writing to file: ${tempTrelloFile}`);
    });

    vscode.workspace.openTextDocument(tempTrelloFile)
      .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, false))
      .then(() => vscode.commands.executeCommand('markdown.showPreview'))
  }
};

export function removeTempTrelloFile(tempTrelloFileName: string) {
  const userDataFolder = new UserDataFolder();
  const tempTrelloFile = userDataFolder.getPathCodeSettings() + tempTrelloFileName;
  fs.unlink(tempTrelloFile, (err) => {
    if (err) throw err;
    console.log(`Deleted file: ${tempTrelloFile}`);
  });
}
