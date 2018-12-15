import * as vscode from "vscode";
import { writeFile, unlink } from "fs";
import axios from "axios";
import { UserDataFolder } from "./UserDataFolder";
import {
  DEFAULT_VIEW_COLUMN,
  TEMP_TRELLO_FILE_NAME,
  TRELLO_API_BASE_URL,
  SETTING_PREFIX,
  SETTING_CONFIG,
  GLOBALSTATE_CONFIG,
} from "./constants";

export class TrelloComponent {
  private globalState: any;
  private API_KEY: string | undefined;
  private API_TOKEN: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.globalState = context.globalState;
    this.getCredentials();

    axios.defaults.baseURL = TRELLO_API_BASE_URL;
  }

  private isCredentialsProvided(): boolean {
    return !!this.API_KEY && !!this.API_TOKEN;
  }

  private getCredentials(): void {
    this.API_KEY = this.globalState.get(GLOBALSTATE_CONFIG.API_KEY);
    this.API_TOKEN = this.globalState.get(GLOBALSTATE_CONFIG.API_TOKEN);
  }

  resetCredentials(): void {
    this.globalState.update(GLOBALSTATE_CONFIG.API_KEY, undefined);
    this.globalState.update(GLOBALSTATE_CONFIG.API_TOKEN, undefined);
  }

  async setCredentials(): Promise<void> {
    const apiKey = await this.setTrelloCredential(false, "Your Trello API key");
    const apiToken = await this.setTrelloCredential(true, "Your Trello API token");
    if (apiKey !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_KEY, apiKey);
    if (apiToken !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_TOKEN, apiToken);
    this.getCredentials();
  }

  showTrelloKeyToken(): void {
    this.getCredentials();
    vscode.window.showInformationMessage("Test", `API key: ${this.API_KEY}`, `API token: ${this.API_TOKEN}`);
  }

  setTrelloCredential(isPassword: boolean, placeHolderText: string): Thenable<string | undefined> {
    return vscode.window
      .showInputBox({ ignoreFocusOut: true, password: isPassword, placeHolder: placeHolderText })
  }

  trelloApiRequest(url: string, params: object): Promise<any> | undefined {
    return axios.get(url, { params });
  }

  async getStarredBoards(): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }
    try {
      const boards = await this.trelloApiRequest("/1/members/me/boards", {
        filter: "starred",
        key: this.API_KEY,
        token: this.API_TOKEN
      });
      console.log("🅱 getting boards");
      // console.log(boards.data);
      return boards.data;
    } catch (error) {
      vscode.window.showErrorMessage("Unable to fetch from Trello Api. Please check crendentials provided.");
      console.error(error);
    }
  }

  async getListsFromBoard(boardId: string): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    if (boardId === '-1') {
      vscode.window.showErrorMessage("Could not get Board ID");
      return;
    }
    try {
      const lists = await this.trelloApiRequest(`/1/boards/${boardId}/lists`, {
        key: this.API_KEY,
        token: this.API_TOKEN
      });
      console.log("🅱 getting lists");
      // console.log(lists.data);
      return lists.data;
    } catch (error) {
      vscode.window.showErrorMessage("Unable to fetch from Trello Api. Please check crendentials provided.");
      console.error(error);
    }
  }

  async getCardsFromList(listId: string): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    if (listId === '-1') {
      vscode.window.showErrorMessage("Could not get List ID");
      return;
    }

    try {
      const cards = await this.trelloApiRequest(`/1/lists/${listId}/cards`, {
        key: this.API_KEY,
        token: this.API_TOKEN,
        attachments: "cover"
      });
      console.log("🎴 getting cards");
      // console.log(cards.data);
      return cards.data;
    } catch (error) {
      vscode.window.showErrorMessage("Unable to fetch from Trello Api. Please check crendentials provided.");
      console.error(error);
    }
  }

  async getCardById(cardId: string): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    if (cardId === '-1') {
      vscode.window.showErrorMessage("Could not get Card ID");
      return;
    }

    const card = await this.trelloApiRequest(`/1/cards/${cardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN
    });
    console.log("🎴 getting cards");
    // console.log(card.data);
    return card.data;
  }

  async showCard(card: any): Promise<any> {
    if (!card) {
      vscode.window.showErrorMessage("No card selected or invalid card.");
      return;
    }
    console.log(card);
    // Get content of card as markdown
    const cardUrl = card.url || "## No url found ##";
    const cardHeader = card.name || "## No card name found ##";
    const cardBody = card.desc || "## No card description found ##";
    const cardCoverImageUrl = (card.attachments.length > 0) ?  card.attachments[0].url : "";
    const cardContent =
      `${cardUrl}\n\n---\n## ===TITLE===\n${cardHeader}\n\n---\n## ===DESCRIPTION===\n${cardBody}\n\n---\n` +
      `<img src="${cardCoverImageUrl}" alt="no cover image" />`;

    // Get location of user's vs code folder to save temp markdown file
    const tempTrelloFile = (new UserDataFolder()).getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
    writeFile(tempTrelloFile, cardContent, err => {
      if (err) {
        vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
      }
      console.log(`✍Writing to file: ${tempTrelloFile}`);
    });

    // open markdown file and preview view
    let viewColumn: vscode.ViewColumn = vscode.workspace
        .getConfiguration(SETTING_PREFIX, null)
        .get(SETTING_CONFIG.VIEW_COLUMN) || DEFAULT_VIEW_COLUMN;
    if (!([-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9].indexOf(viewColumn) > -1)) {
      console.log(`Invalid ${SETTING_PREFIX}.viewColumn ${viewColumn} specified; using column ${DEFAULT_VIEW_COLUMN}`);
      viewColumn = DEFAULT_VIEW_COLUMN;
    }
    vscode.workspace
      .openTextDocument(tempTrelloFile)
      .then(doc => vscode.window.showTextDocument(doc, viewColumn, false))
      .then(() => vscode.commands.executeCommand("markdown.showPreview"))
      .then(() => vscode.commands.executeCommand("markdown.preview.toggleLock"));
  }
}

export function removeTempTrelloFile() {
  const userDataFolder = new UserDataFolder();
  const tempTrelloFile = userDataFolder.getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
  unlink(tempTrelloFile, err => {
    if (err) throw err;
    console.log(`❌Deleted file: ${tempTrelloFile}`);
  });
}
