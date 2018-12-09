import * as vscode from "vscode";
import { writeFile, unlink } from "fs";
import axios from "axios";
import { UserDataFolder } from "./UserDataFolder";

const TEMP_TRELLO_FILE_NAME = '~vscodeTrello.md';
const TRELLO_API_BASE_URL = 'https://api.trello.com';

export class TrelloComponent {
  private globalState: any;
  private API_KEY: string;
  private API_TOKEN: string;

  private selectedCard: any | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.globalState = context.globalState;
    this.API_KEY = this.getTrelloKey();
    this.API_TOKEN = this.getTrelloToken();

    axios.defaults.baseURL = TRELLO_API_BASE_URL;
  }

  private getTrelloKey(): string {
    return this.globalState.get("TRELLO_API_KEY") || "";
  }

  private getTrelloToken(): string {
    return this.globalState.get("TRELLO_API_TOKEN") || "";
  }

  checkCredentialsProvided(): boolean {
    return (!!this.API_KEY && !!this.API_TOKEN);
  }

  getTrelloKeyToken(): void {
    this.API_KEY = this.getTrelloKey();
    this.API_TOKEN = this.getTrelloToken();
    vscode.window.showInformationMessage('Test', `Got API key: ${this.API_KEY}`, `API token: ${this.API_TOKEN}`);
  }

  setTrelloKey(): void {
    vscode.window.showInputBox({ignoreFocusOut: true, password: false, placeHolder: "Your Trello API key"})
      .then(res => {
        this.API_KEY = res || '';
        this.globalState.update("TRELLO_API_KEY", res);
      });
  }

  setTrelloToken(): void {
    vscode.window.showInputBox({ignoreFocusOut: true, password: true, placeHolder: "Your Trello API token"})
      .then(res => {
        this.API_TOKEN = res || '';
        this.globalState.update("TRELLO_API_TOKEN", res);
      });
  }

  getStarredBoards(): void {
    if (!this.checkCredentialsProvided()) {
      vscode.window.showWarningMessage('Credentials Missing: please provide API key and token to use.');
      return;
    }

    axios
      .get(`/1/members/me/boards?filter=starred&key=${this.API_KEY}&token=${this.API_TOKEN}`)
      .then(res => {
        console.log(`⭐getting starred boards`);
        // console.log(res);
        const boardNames = res.data.map((board: any) => board.name);
        vscode.window.showInformationMessage('Starred Boards: ' + boardNames.join(', '));
      })
      .catch(err => {
        console.log(err.response);
        vscode.window.showErrorMessage('Error fetching from Trello API: please check credentials');
      });
  }

  getListsFromBoard(boardId: string): void {
    if (!this.checkCredentialsProvided()) {
      vscode.window.showWarningMessage('Credentials Missing: please provide API key and token to use.');
      return;
    }

    axios
      .get(`/1/boards/${boardId}/lists/?key=${this.API_KEY}&token=${this.API_TOKEN}`)
      .then(res => {
        console.info(`📜Getting lists for selected board: ${boardId}`);
        // console.log(res);
        vscode.window.showInformationMessage('Lists: ' + res.data.map((list: any) => list.name).join(', '));
      })
      .catch(err => {
        console.log(err.response);
        vscode.window.showErrorMessage(`Error fetching lists from board: ${err.response.data}`);
      });
  }

  getCardById(listId: string): void {
    if (!this.checkCredentialsProvided()) {
      vscode.window.showWarningMessage('Credentials Missing: please provide API key and token to use.');
      return;
    }

    axios
      .get(`/1/cards/${listId}?key=${this.API_KEY}&token=${this.API_TOKEN}`)
      .then(res => {
        console.info(`💳Getting cards for selected list: ${listId}`);
        // console.log(res);
        this.selectedCard = res.data;
        vscode.window.showInformationMessage(`Got card: ${res.data.name}`);
      })
      .catch(err => {
        console.log(err);
        vscode.window.showErrorMessage(`Error fetching cards from list: ${err.response.data}`);
      });
  };

  showTrelloCard(): void {
    if (!this.selectedCard) {
      vscode.window.showErrorMessage('No card selected or invalid card.');
      return;
    }
    // Get content of card as markdown
    const cardUrl = this.selectedCard.url || '## No url found ##';
    const cardHeader = this.selectedCard.name || '## No card name found ##';
    const cardBody = this.selectedCard.desc || '## No card description found ##';
    const cardContent =
      `${cardUrl}\n\n---\n` +
      `## TITLE: \n${cardHeader}\n\n---\n` +
      `## DESCRIPTION: \n${cardBody}\n\n---\n`;

    // Get location of user's vs code folder to save temp markdown file
    const userDataFolder = new UserDataFolder();
    const tempTrelloFile = userDataFolder.getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
    writeFile(tempTrelloFile, cardContent, err => {
      if (err) {
        vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
      }
      console.log(`✍Writing to file: ${tempTrelloFile}`);
    });

    // open markdown file and preview view
    vscode.workspace.openTextDocument(tempTrelloFile)
      .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, false))
      .then(() => vscode.commands.executeCommand('markdown.showPreview'));
  }
};

export function removeTempTrelloFile() {
  const userDataFolder = new UserDataFolder();
  const tempTrelloFile = userDataFolder.getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
  unlink(tempTrelloFile, err => {
    if (err) throw err;
    console.log(`❌Deleted file: ${tempTrelloFile}`);
  });
}
