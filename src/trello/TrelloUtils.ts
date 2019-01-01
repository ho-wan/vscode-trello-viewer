import * as vscode from "vscode";
import axios from "axios";
import { writeFile, unlink } from "fs";

import { UserDataFolder } from "../common/UserDataFolder";
import { encrypt, decrypt } from "../common/encrypt";
import { TrelloItem } from "./TrelloItem";
import { TrelloBoard, TrelloList, TrelloCard, TrelloChecklist, CheckItem } from "./trelloComponents";
import {
  VSCODE_VIEW_COLUMN,
  TEMP_TRELLO_FILE_NAME,
  TRELLO_API_BASE_URL,
  SETTING_PREFIX,
  SETTING_CONFIG,
  GLOBALSTATE_CONFIG,
} from "./constants";

export class TrelloUtils {
  private globalState: any;
  private API_KEY: string | undefined;
  private API_TOKEN: string | undefined;
  private FAVORITE_LIST_ID: string | undefined;

  constructor(context?: vscode.ExtensionContext) {
    this.globalState = context ? context.globalState : {};
    axios.defaults.baseURL = TRELLO_API_BASE_URL;

    this.getCredentials();
    this.getFavoriteList();
  }

  isCredentialsProvided(): boolean {
    return !!this.API_KEY && !!this.API_TOKEN;
  }

  private getCredentials(): void {
    try {
      this.API_KEY = this.globalState.get(GLOBALSTATE_CONFIG.API_KEY);
      this.API_TOKEN = decrypt(this.globalState.get(GLOBALSTATE_CONFIG.API_TOKEN));
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error getting credentials");
    }
  }

  setTrelloCredential(isPassword: boolean, placeHolderText: string): Thenable<string | undefined> {
    return vscode.window.showInputBox({ ignoreFocusOut: true, password: isPassword, placeHolder: placeHolderText });
  }

  // Allows user to set api key and token directly using the vscode input box
  async setCredentials(): Promise<void> {
    try {
      const apiKey = await this.setTrelloCredential(false, "Your Trello API key");
      const apiToken = await this.setTrelloCredential(true, "Your Trello API token");
      if (apiKey !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_KEY, apiKey);
      if (apiToken !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_TOKEN, encrypt(apiToken));
      this.getCredentials();
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error while setting credentials");
    }
  }

  // Opens browser links for user to get Trello API Key and then Token
  async authenticate(): Promise<void> {
    try {
      const apiKey = await this.setTrelloCredential(false, "Your Trello API key");
      if (apiKey !== undefined) {
        this.globalState.update(GLOBALSTATE_CONFIG.API_KEY, apiKey);
        await this.fetchApiToken(apiKey);
        this.getCredentials();
      } else {
        const string = await vscode.window.showInformationMessage(
          "Get your Trello API key here:",
          "https://trello.com/app-key"
        );
        if (string !== undefined) {
          vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(string));
        }
      }

      vscode.commands.executeCommand("trelloViewer.refresh");
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error during authentication");
    }
  }

  // Generates a Trello API token and opens link in external browser
  async fetchApiToken(apiKey: string): Promise<void> {
    const apiTokenUrl = `https://trello.com/1/authorize?expiration=never&name=VS%20Code%20Trello%20Viewer&scope=read&response_type=token&key=${apiKey}`;
    try {
      vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(apiTokenUrl));
      const apiToken = await this.setTrelloCredential(true, "Your Trello API token");
      if (apiToken !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.API_TOKEN, encrypt(apiToken));
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error fetching API token");
    }
  }

  // Deletes all saved info in globalstate (key, token, favouriteList)
  resetCredentials(): void {
    Object.keys(GLOBALSTATE_CONFIG).forEach(key => {
      const value: string = GLOBALSTATE_CONFIG[key];
      this.globalState.update(value, undefined);
    });
    vscode.window.showInformationMessage("Credentials have been reset");
    this.getCredentials();

    vscode.commands.executeCommand("trelloViewer.refresh");
  }

  // shows saved user info in vscode info message, API token is hashed
  showTrelloInfo(): void {
    this.getCredentials();
    this.getFavoriteList();
    let info: string = "";
    Object.keys(GLOBALSTATE_CONFIG).forEach(key => {
      const value: string = this.globalState.get(GLOBALSTATE_CONFIG[key]);
      info += `${key}: ${value}, `;
    });
    vscode.window.showInformationMessage(info);
  }

  private async trelloApiRequest(url: string, params: object, credentialsRequired: boolean = true): Promise<any> {
    if (credentialsRequired && !this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return null;
    }
    const res = await axios.get(url, { params }).catch(error => {
      console.error(error);
      vscode.window.showErrorMessage("Unable to fetch from Trello Api: please check crendentials.");
      return null;
    });
    return res ? res.data : null;
  }

  async getBoardById(boardId: string, credentialsRequired: boolean = true): Promise<TrelloBoard> {
    const board = await this.trelloApiRequest(
      `/1/boards/${boardId}`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
    return board;
  }

  async getListById(listId: string, credentialsRequired: boolean = true): Promise<TrelloList> {
    const list = await this.trelloApiRequest(
      `/1/lists/${listId}`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
    return list;
  }

  async getBoards(starredBoards?: boolean): Promise<TrelloBoard[]> {
    const boards = await this.trelloApiRequest("/1/members/me/boards", {
      filter: starredBoards ? "starred" : "all",
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return boards;
  }

  async getListsFromBoard(boardId: string, credentialsRequired: boolean = true): Promise<TrelloList[]> {
    const lists = await this.trelloApiRequest(
      `/1/boards/${boardId}/lists`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
    return lists;
  }

  async getCardsFromList(listId: string, credentialsRequired: boolean = true): Promise<TrelloCard[]> {
    const cards = await this.trelloApiRequest(
      `/1/lists/${listId}/cards`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
        attachments: "cover",
      },
      credentialsRequired
    );
    return cards;
  }

  async getCardById(cardId: string, credentialsRequired: boolean = true): Promise<TrelloCard> {
    const card = await this.trelloApiRequest(
      `/1/cards/${cardId}`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
    return card;
  }

  async getChecklistById(checklistId: string): Promise<TrelloChecklist> {
    const checklist = await this.trelloApiRequest(`/1/checklists/${checklistId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return checklist;
  }

  getFavoriteList(): string | undefined {
    try {
      this.FAVORITE_LIST_ID = this.globalState.get(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID);
      return this.FAVORITE_LIST_ID;
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error getting favorite list");
    }
  }

  getInitialFavoriteList(): Promise<TrelloList> {
    if (!this.FAVORITE_LIST_ID) return Promise.reject("No favorite list");
    return this.getListById(this.FAVORITE_LIST_ID);
  }

  setFavoriteListByClick(trelloItem: TrelloItem): void {
    if (!trelloItem.id) {
      vscode.window.showErrorMessage("Could not get valid List ID");
      return;
    }
    this.setFavoriteList(trelloItem.id);
  }

  setFavoriteList(listId: string): void {
    console.info(`📄 Setting favorite list: ${listId}`);
    if (listId !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID, listId);
    this.getFavoriteList();
    vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
  }

  resetFavoriteList(): void {
    this.globalState.update(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID, null);
    this.getFavoriteList();
    vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
  }

  showChecklistsAsMarkdown(checklists: any): string | undefined {
    if (!checklists) {
      return;
    } else if (checklists.length == 0) {
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
      console.info(`✍ Writing to file: ${tempTrelloFile}`);
    });

    // open markdown file and preview view
    let viewColumn: vscode.ViewColumn =
      vscode.workspace.getConfiguration(SETTING_PREFIX, null).get(SETTING_CONFIG.VIEW_COLUMN) ||
      SETTING_CONFIG.DEFAULT_VIEW_COLUMN;
    if (!(VSCODE_VIEW_COLUMN.indexOf(viewColumn) > -1)) {
      vscode.window.showInformationMessage(`Invalid ${SETTING_PREFIX}.viewColumn ${viewColumn} specified`);
      viewColumn = SETTING_CONFIG.DEFAULT_VIEW_COLUMN;
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
    console.info(`❌ Deleted file: ${tempTrelloFile}`);
  });
}
