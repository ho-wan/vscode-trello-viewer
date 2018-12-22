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
  private SELECTED_LIST_ID: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.globalState = context.globalState;
    axios.defaults.baseURL = TRELLO_API_BASE_URL;

    this.getCredentials();
    this.getSelectedList();
  }

  private isCredentialsProvided(): boolean {
    return !!this.API_KEY && !!this.API_TOKEN;
  }

  private getCredentials(): void {
    this.API_KEY = this.globalState.get(GLOBALSTATE_CONFIG.API_KEY);
    this.API_TOKEN = this.globalState.get(GLOBALSTATE_CONFIG.API_TOKEN);
  }

  resetCredentials(): void {
    Object.keys(GLOBALSTATE_CONFIG).forEach(key => {
      // @ts-ignore
      const value: string = GLOBALSTATE_CONFIG[key];
      this.globalState.update(value, undefined)
    });
    vscode.window.showInformationMessage("Credentials have been reset");
    this.getCredentials();
  }

  async setCredentials(): Promise<void> {
    const apiKey = await this.setTrelloCredential(false, "Your Trello API key");
    const apiToken = await this.setTrelloCredential(true, "Your Trello API token");
    if (apiKey !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_KEY, apiKey);
    if (apiToken !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_TOKEN, apiToken);
    this.getCredentials();
  }

  showTrelloInfo(): void {
    this.getCredentials();
    this.getSelectedList();
    let info: string = '';
    Object.keys(GLOBALSTATE_CONFIG).forEach(key => {
      // @ts-ignore#
      const value: string = this.globalState.get(GLOBALSTATE_CONFIG[key]);
      info += `${key}: ${value}, `;
    });
    vscode.window.showInformationMessage(info);
  }

  private setTrelloCredential(isPassword: boolean, placeHolderText: string): Thenable<string | undefined> {
    return vscode.window
      .showInputBox({ ignoreFocusOut: true, password: isPassword, placeHolder: placeHolderText })
  }

  private async trelloApiRequest(url: string, params: object): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return Promise.reject(new Error('Credentials Missing'));
    }

    return axios.get(url, { params })
      .catch(err => {
        console.log(err);
        vscode.window.showErrorMessage("Unable to fetch from Trello Api. Please check crendentials provided.");
      });
  }

  getSelectedList(): void {
    this.SELECTED_LIST_ID = this.globalState.get(GLOBALSTATE_CONFIG.SELECTED_LIST_ID);
  }

  async setSelectedListId(): Promise<void> {
    const selectedListId = await this.setTrelloCredential(false, "Set Selected List by ID");
    if (selectedListId !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.SELECTED_LIST_ID, selectedListId);
    this.getSelectedList();
  }

  setSelectedListByClick(trelloItem: any): void {
    // console.log('clicked set select list');
    // console.log(trelloItem);
    if (!trelloItem.id) {
      vscode.window.showErrorMessage("Could not get valid List ID");
      return;
    }
    this.setSelectedList(trelloItem.id);
  }

  setSelectedList(listId: string): void {
    console.log(`Setting selected list: ${listId}`);
    if (listId !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.SELECTED_LIST_ID, listId);
    this.getSelectedList();
    vscode.commands.executeCommand("trelloViewer.refreshSelectedList");
  }

  async getInitialSelectedList(): Promise<any> {
    if (!this.SELECTED_LIST_ID) {
      console.log('no list selected');
      return;
    };
    return this.getListById(this.SELECTED_LIST_ID);
  }

  async getBoardById(boardId: string): Promise<any> {
    const board = await this.trelloApiRequest(`/1/boards/${boardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    console.log("⬜ getting board by id");
    // console.log(board.data);
    return board.data;
  }

  async getListById(listId: string): Promise<any> {
    const list = await this.trelloApiRequest(`/1/lists/${listId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    console.log("📃 getting list by id");
    // console.log(list.data);
    return list.data;
  }

  async getStarredBoards(): Promise<any> {
    const boards = await this.trelloApiRequest("/1/members/me/boards", {
      filter: "starred",
      key: this.API_KEY,
      token: this.API_TOKEN
    });
    console.log("🅱 getting boards");
    return boards.data;
  }

  async getListsFromBoard(boardId: string): Promise<any> {
    const lists = await this.trelloApiRequest(`/1/boards/${boardId}/lists`, {
      key: this.API_KEY,
      token: this.API_TOKEN
    });
    console.log("🅱 getting lists");
    // console.log(lists.data);
    return lists.data;
  }

  async getCardsFromList(listId: string): Promise<any> {
    const cards = await this.trelloApiRequest(`/1/lists/${listId}/cards`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      attachments: "cover"
    });
    console.log("🎴 getting cards");
    // console.log(cards.data);
    return cards.data;
  }

  async getCardById(cardId: string): Promise<any> {
    const card = await this.trelloApiRequest(`/1/cards/${cardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN
    });
    console.log("🎴 getting cards");
    // console.log(card.data);
    return card.data;
  }

  async getChecklistById(checklistId: string): Promise<any> {
    const checklist = await this.trelloApiRequest(`/1/checklists/${checklistId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN
    });
    console.log(`✅ getting checklist: ${checklist.data.name}`);
    // console.log(checklist.data);
    return checklist.data;
  }

  async showCard(card: any): Promise<any> {
    if (!card) {
      vscode.window.showErrorMessage("No card selected or invalid card.");
      return;
    }
    // console.log(card);
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

  showInfoMessage(info: string) {
    vscode.window.showInformationMessage(`${info}`);
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
