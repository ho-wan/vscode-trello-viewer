import * as vscode from "vscode";
import axios from "axios";
import { writeFile, unlink } from "fs";

import { UserDataFolder } from "../common/UserDataFolder";
import { encrypt, decrypt } from "../common/encrypt";
import { TrelloItem } from "./TrelloItem";
import {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloChecklist,
  TrelloActionComment,
  CheckItem,
  TrelloMember,
} from "./trelloComponents";
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
  private MY_MEMBER_ID: string | undefined;
  private tempTrelloFile: string;

  constructor(context?: vscode.ExtensionContext) {
    this.globalState = context ? context.globalState : {};
    axios.defaults.baseURL = TRELLO_API_BASE_URL;
    this.tempTrelloFile = new UserDataFolder().getPathCodeSettings() + TEMP_TRELLO_FILE_NAME || "";

    this.getCredentials();
    this.getFavoriteList();
    this.getMemberId();
    this.setMarkdownPreviewBreaks();
  }

  setMarkdownPreviewBreaks(): void {
    try {
      const config = vscode.workspace.getConfiguration("markdown.preview", null);
      const showPreviewBreaks = config.get<boolean>("breaks");
      if (!showPreviewBreaks) {
        config.update("breaks", true, true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  isCredentialsProvided(): boolean {
    return !!this.API_KEY && !!this.API_TOKEN;
  }

  getCredentials(): void {
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
        const appKeyUrl = await vscode.window.showInformationMessage(
          "Get your Trello API key here:",
          "https://trello.com/app-key"
        );
        if (appKeyUrl) {
          vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(appKeyUrl));
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
    const apiTokenUrl = `https://trello.com/1/authorize?expiration=never&name=VS%20Code%20Trello%20Viewer&scope=read,write,account&response_type=token&key=${apiKey}`;
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

  async trelloApiGetRequest(url: string, params: object, credentialsRequired: boolean = true): Promise<any> {
    if (credentialsRequired && !this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return null;
    }

    try {
      const res = await axios.get(url, { params });
      return res.data;
    } catch (error) {
      if (error.response) {
        console.error(error.response);
        vscode.window.showErrorMessage(`${error.response.data}`);
      }
    }
    return null;
  }

  async trelloApiPostRequest(url: string, params: object, credentialsRequired: boolean = true): Promise<any> {
    if (credentialsRequired && !this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return null;
    }

    try {
      const res = await axios.post(url, params);
      return res.data;
    } catch (error) {
      if (error.response) {
        console.error(error.response);
        vscode.window.showErrorMessage(`${error.response.data}`);
      }
    }
    return null;
  }

  async getMemberId(): Promise<void> {
    const response = await this.trelloApiGetRequest(`/1/members/me`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    this.MY_MEMBER_ID = response.id;
  }

  async getBoardById(boardId: string, credentialsRequired: boolean = true): Promise<TrelloBoard> {
    const board = await this.trelloApiGetRequest(
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
    const list = await this.trelloApiGetRequest(
      `/1/lists/${listId}`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
    return list;
  }

  getBoards(starredBoards?: boolean): Promise<TrelloBoard[]> {
    return this.trelloApiGetRequest("/1/members/me/boards", {
      filter: starredBoards ? "starred" : "all",
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
  }

  getListsFromBoard(boardId: string, credentialsRequired: boolean = true): Promise<TrelloList[]> {
    return this.trelloApiGetRequest(
      `/1/boards/${boardId}/lists`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
  }

  getCardsFromList(listId: string, credentialsRequired: boolean = true): Promise<TrelloCard[]> {
    return this.trelloApiGetRequest(
      `/1/lists/${listId}/cards`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
        attachments: "cover",
        actions: "commentCard",
        actions_limit: 20,
        members: true,
      },
      credentialsRequired
    );
  }

  getCardById(cardId: string, credentialsRequired: boolean = true): Promise<TrelloCard> {
    return this.trelloApiGetRequest(
      `/1/cards/${cardId}`,
      {
        key: this.API_KEY,
        token: this.API_TOKEN,
      },
      credentialsRequired
    );
  }

  getChecklistById(checklistId: string): Promise<TrelloChecklist> {
    return this.trelloApiGetRequest(`/1/checklists/${checklistId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
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
    if (listId !== undefined) this.globalState.update(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID, listId);
    this.getFavoriteList();
    vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
  }

  async addCardToList(trelloItem: TrelloItem): Promise<void> {
    if (!trelloItem.id) {
      vscode.window.showErrorMessage("Could not get valid List ID");
      return;
    }
    const listId = trelloItem.id;

    const cardName = await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: "Enter name of card" });
    if (cardName === undefined) return;

    const resData = await this.trelloApiPostRequest("/1/cards", {
      key: this.API_KEY,
      token: this.API_TOKEN,
      idList: listId,
      name: cardName,
    });

    if (resData) {
      vscode.commands.executeCommand("trelloViewer.refresh");
      if (listId === this.FAVORITE_LIST_ID) {
        vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
      }

      const cardUrl = await vscode.window.showInformationMessage(
        `Created Card: ${resData.idShort}-${resData.name}`,
        resData.shortUrl
      );
      if (cardUrl) {
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(cardUrl));
      }
    }
  }

  async addUserToCard(trelloItem: TrelloItem): Promise<void> {
    if (!trelloItem.id) {
      vscode.window.showErrorMessage("Could not get valid Card ID");
      return;
    }
    const cardId = trelloItem.id;

    const resData = await this.trelloApiPostRequest(`/1/cards/${cardId}/idMembers`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      value: this.MY_MEMBER_ID,
    });

    if (resData) {
      vscode.window.showInformationMessage(`Added myself to Card!`);
    }
  }

  resetFavoriteList(): void {
    this.globalState.update(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID, null);
    this.getFavoriteList();
    vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
  }

  showCardMembersAsString(members: TrelloMember[]): string {
    if (!members || members.length == 0) {
      return "";
    }
    return members.map(member => member.initials).join(", ");
  }

  showChecklistsAsMarkdown(checklists: TrelloChecklist[]): string {
    if (!checklists || checklists.length == 0) {
      return "";
    }

    let checklistMarkdown: string = "";
    checklists.map(checklist => {
      checklistMarkdown += `\n> ${checklist.name}\n\n`;
      checklist.checkItems
        .sort((checkItem1: CheckItem, checkItem2: CheckItem) => checkItem1.pos - checkItem2.pos)
        .map((checkItem: CheckItem) => {
          checklistMarkdown +=
            checkItem.state === "complete" ? `✅ ~~${checkItem.name}~~  \n` : `🔳 ${checkItem.name}  \n`;
        });
    });
    return checklistMarkdown;
  }

  showCommentsAsMarkdown(comments: TrelloActionComment[]): string {
    if (!comments || comments.length == 0) {
      return "";
    }

    let commentsMarkdown: string = "";
    comments.map((comment: TrelloActionComment) => {
      const date = new Date(comment.date);
      const dateString = `${date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
      const timeString = `${date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
      commentsMarkdown += `\n> ${comment.memberCreator.fullName} - ${dateString} at ${timeString} ${
        comment.data.dateLastEdited ? "(edited)" : ""
      } \n`;
      commentsMarkdown += `\n\n${comment.data.text}\n\n`;
    });
    return commentsMarkdown;
  }

  showMarkdownDecorated(header: string, content: string | undefined): string {
    if (!content) {
      return "";
    }
    return `## **\`${header}\`** \n${content}\n\n--- \n`;
  }

  async showCard(card: TrelloCard): Promise<void> {
    if (!card) {
      vscode.window.showErrorMessage("No card selected or invalid card.");
      return;
    }

    const cardMembers: string = this.showCardMembersAsString(card.members);
    const checklistItems: string = this.showChecklistsAsMarkdown(card.trelloChecklists);
    const commentItems: string = this.showCommentsAsMarkdown(card.actions);
    const cardCoverImageUrl = !!card.attachments && card.attachments.length > 0 ? card.attachments[0].url : "";

    const cardContentAndHeaders = [
      { header: "URL", content: card.url },
      { header: "Title", content: card.name },
      { header: "Members", content: cardMembers },
      { header: "Description", content: card.desc },
      { header: "Checklists", content: checklistItems },
      { header: "Comments", content: commentItems },
    ];

    let cardContent: string = "";
    cardContentAndHeaders.map(({ header, content }) => {
      cardContent += this.showMarkdownDecorated(header, content);
    });
    cardContent += cardCoverImageUrl ? `<img src="${cardCoverImageUrl}" alt="Image not found" />` : "";

    // Write temp markdown file at user's vs code default settings directory
    writeFile(this.tempTrelloFile, cardContent, err => {
      if (err) {
        vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
      }
      console.info(`✍ Writing to file: ${this.tempTrelloFile}`);
    });

    // open markdown file and preview view
    let viewColumn: vscode.ViewColumn =
      vscode.workspace.getConfiguration(SETTING_PREFIX, null).get(SETTING_CONFIG.VIEW_COLUMN) ||
      SETTING_CONFIG.DEFAULT_VIEW_COLUMN;
    if (!(VSCODE_VIEW_COLUMN.indexOf(viewColumn) > -1)) {
      vscode.window.showInformationMessage(`Invalid ${SETTING_PREFIX}.viewColumn ${viewColumn} specified`);
      viewColumn = SETTING_CONFIG.DEFAULT_VIEW_COLUMN;
    }

    const doc = await vscode.workspace.openTextDocument(this.tempTrelloFile);
    await vscode.window.showTextDocument(doc, viewColumn, false);
    await vscode.commands.executeCommand("markdown.showPreview");
    vscode.commands.executeCommand("markdown.preview.toggleLock");
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
