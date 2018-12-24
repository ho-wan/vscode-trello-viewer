import * as vscode from "vscode";
import { writeFile, unlink } from "fs";
import axios from "axios";
import { UserDataFolder } from "./UserDataFolder";
import {
  DEFAULT_VIEW_COLUMN,
  VSCODE_VIEW_COLUMN,
  TEMP_TRELLO_FILE_NAME,
  TRELLO_API_BASE_URL,
  SETTING_PREFIX,
  SETTING_CONFIG,
  GLOBALSTATE_CONFIG,
} from "./constants";
import { TrelloItem } from "./trelloItem";
import { TrelloBoard, TrelloList, TrelloCard, TrelloChecklist, CheckItem } from "./trelloComponents";
import { encrypt, decrypt } from "./encrypt";

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
    try {
      this.API_KEY = this.globalState.get(GLOBALSTATE_CONFIG.API_KEY);
      this.API_TOKEN = decrypt(this.globalState.get(GLOBALSTATE_CONFIG.API_TOKEN));
    } catch (error) {
      console.error(error);
    }
  }

  resetCredentials(): void {
    Object.keys(GLOBALSTATE_CONFIG).forEach(key => {
      const value: string = GLOBALSTATE_CONFIG[key];
      this.globalState.update(value, undefined);
    });
    vscode.window.showInformationMessage("Credentials have been reset");
    this.getCredentials();
  }

  async setCredentials(): Promise<void> {
    try {
      const apiKey = await this.setTrelloCredential(false, "Your Trello API key");
      const apiToken = await this.setTrelloCredential(true, "Your Trello API token");
      if (apiKey !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_KEY, apiKey);
      if (apiToken !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_TOKEN, encrypt(apiToken));
    } catch (error) {
      console.error(error);
    }
    this.getCredentials();
  }

  showTrelloInfo(): void {
    this.getCredentials();
    this.getSelectedList();
    let info: string = "";
    Object.keys(GLOBALSTATE_CONFIG).forEach(key => {
      const value: string = this.globalState.get(GLOBALSTATE_CONFIG[key]);
      info += `${key}: ${value}, `;
    });
    vscode.window.showInformationMessage(info);
  }

  private setTrelloCredential(isPassword: boolean, placeHolderText: string): Thenable<string | undefined> {
    return vscode.window.showInputBox({ ignoreFocusOut: true, password: isPassword, placeHolder: placeHolderText });
  }

  private async trelloApiRequest(url: string, params: object): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return Promise.reject(new Error("Credentials Missing"));
    }

    return axios.get(url, { params }).catch(err => {
      console.error(err);
      vscode.window.showErrorMessage("Unable to fetch from Trello Api: please check crendentials.");
    });
  }

  getSelectedList(): boolean {
    this.SELECTED_LIST_ID = this.globalState.get(GLOBALSTATE_CONFIG.SELECTED_LIST_ID);
    return (this.SELECTED_LIST_ID !== undefined);
  }

  async setSelectedListId(): Promise<void> {
    const selectedListId = await this.setTrelloCredential(false, "Set Selected List by ID");
    if (selectedListId !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.SELECTED_LIST_ID, selectedListId);
    this.getSelectedList();
  }

  setSelectedListByClick(trelloItem: TrelloItem): void {
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

  getInitialSelectedList(): Promise<TrelloList> {
    return this.getListById(this.SELECTED_LIST_ID || "-1");
  }

  async getBoardById(boardId: string): Promise<TrelloBoard> {
    const board = await this.trelloApiRequest(`/1/boards/${boardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return board.data;
  }

  async getListById(listId: string): Promise<TrelloList> {
    const list = await this.trelloApiRequest(`/1/lists/${listId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return list.data;
  }

  async getStarredBoards(): Promise<TrelloBoard[]> {
    const boards = await this.trelloApiRequest("/1/members/me/boards", {
      filter: "starred",
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return boards.data;
  }

  async getListsFromBoard(boardId: string): Promise<TrelloList[]> {
    const lists = await this.trelloApiRequest(`/1/boards/${boardId}/lists`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return lists.data;
  }

  async getCardsFromList(listId: string): Promise<TrelloCard[]> {
    const cards = await this.trelloApiRequest(`/1/lists/${listId}/cards`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      attachments: "cover",
    });
    return cards.data;
  }

  async getCardById(cardId: string): Promise<TrelloCard> {
    const card = await this.trelloApiRequest(`/1/cards/${cardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return card.data;
  }

  async getChecklistById(checklistId: string): Promise<TrelloChecklist> {
    const checklist = await this.trelloApiRequest(`/1/checklists/${checklistId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return checklist.data;
  }

  showChecklistsAsMarkdown(checklists: any): string | undefined{
    if (checklists === undefined || checklists.length == 0) {
      return;
    }

    let checklistMarkdown: string = "";
    Object.keys(checklists).forEach(id => {
      const trelloChecklist: TrelloChecklist = checklists[id];
      checklistMarkdown += `\n### ${trelloChecklist.name}  \n`;
      trelloChecklist.checkItems.map((checkItem: CheckItem) => {
        checklistMarkdown +=
          checkItem.state === "complete" ? `✅ ~~${checkItem.name}~~  \n` : `❌ ${checkItem.name}  \n`;
      });
    });

    return checklistMarkdown;
  }

  async showCard(card: TrelloCard): Promise<void> {
    if (!card) {
      vscode.window.showErrorMessage("No card selected or invalid card.");
      return;
    }

    let checklistItems: string | undefined = this.showChecklistsAsMarkdown(card.trelloChecklists);
    const cardCoverImageUrl = card.attachments.length > 0 ? card.attachments[0].url : "";

    let cardContent: string = "";
    cardContent += card.url ? `${card.url}\n\n---\n` : "";
    cardContent += card.name ? `## ===TITLE===\n${card.name}\n\n---\n` : "";
    cardContent += card.desc ? `## ===DESCRIPTION===\n${card.desc}\n\n---\n` : "";
    cardContent += checklistItems ? `## ===CHECKLISTS===\n${checklistItems}\n\n---\n` : "";
    cardContent += cardCoverImageUrl ? `<img src="${cardCoverImageUrl}" alt="Image not found" />` : "";

    // Get location of user's vs code folder to save temp markdown file
    const tempTrelloFile = new UserDataFolder().getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
    writeFile(tempTrelloFile, cardContent, err => {
      if (err) {
        vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
      }
      console.log(`✍Writing to file: ${tempTrelloFile}`);
    });

    // open markdown file and preview view
    let viewColumn: vscode.ViewColumn =
      vscode.workspace.getConfiguration(SETTING_PREFIX, null).get(SETTING_CONFIG.VIEW_COLUMN) || DEFAULT_VIEW_COLUMN;
    if (!(VSCODE_VIEW_COLUMN.indexOf(viewColumn) > -1)) {
      console.error(`Invalid ${SETTING_PREFIX}.viewColumn ${viewColumn} specified; using column ${DEFAULT_VIEW_COLUMN}`);
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
