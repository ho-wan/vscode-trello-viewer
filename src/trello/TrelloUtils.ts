import * as vscode from "vscode";
import axios from "axios";
import { writeFile, unlink } from "fs";

import { UserDataFolder } from "../common/UserDataFolder";
import { encrypt, decrypt } from "../common/encrypt";
import {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloChecklist,
  TrelloActionComment,
  CheckItem,
  TrelloMember,
} from "./trelloComponents";
import { TrelloItem } from "./TrelloItem";
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
  private tempTrelloFile: string;

  constructor(context?: vscode.ExtensionContext) {
    this.globalState = context ? context.globalState : {};
    axios.defaults.baseURL = TRELLO_API_BASE_URL;
    this.tempTrelloFile = new UserDataFolder().getPathCodeSettings() + TEMP_TRELLO_FILE_NAME || "";

    this.getCredentials();
    this.getFavoriteList();
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

  showTrelloInfo(): void {
    this.getCredentials();
    this.getFavoriteList();
    const info = `
      API_KEY = ${this.API_KEY},
      API_TOKEN = ${this.API_TOKEN},
      FAVORITE_LIST_ID = ${this.FAVORITE_LIST_ID},
    `;
    vscode.window.showInformationMessage(info);
  }

  async showSuccessMessage(msg: string, url?: string) {
    let cardUrl;
    if (url) {
      cardUrl = await vscode.window.showInformationMessage(msg, url);
      if (cardUrl) {
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(cardUrl));
      }
    } else {
      vscode.window.showInformationMessage(msg);
    }
  }

  async trelloApiGetRequest(url: string, params: object): Promise<any> {
    try {
      const res = await axios.get(url, { params });
      return res.data;
    } catch (error) {
      if (error.response) {
        console.error("GET error", error.response);
        vscode.window.showErrorMessage(`HTTP error: ${error.response.status} - ${error.response.data}`);
      }
    }
    return null;
  }

  async trelloApiPostRequest(url: string, data: object): Promise<any> {
    try {
      const res = await axios.post(url, data);
      return res.data;
    } catch (error) {
      if (error.response) {
        console.error("POST error", error.response);
        vscode.window.showErrorMessage(`HTTP error: ${error.response.status} - ${error.response.data}`);
      }
    }
    return null;
  }

  async trelloApiPutRequest(url: string, data: object): Promise<any> {
    try {
      const res = await axios.put(url, data);
      return res.data;
    } catch (error) {
      if (error.response) {
        console.error("PUT error", error.response);
        vscode.window.showErrorMessage(`HTTP error: ${error.response.status} - ${error.response.data}`);
      }
    }
    return null;
  }

  async trelloApiDeleteRequest(url: string, params: object): Promise<any> {
    try {
      const res = await axios.delete(url, { params });
      return res.data;
    } catch (error) {
      if (error.response) {
        console.error("DELETE error", error.response);
        vscode.window.showErrorMessage(`HTTP error: ${error.response.status} - ${error.response.data}`);
      }
    }
    return null;
  }

  async getBoardById(boardId: string): Promise<TrelloBoard> {
    const board = await this.trelloApiGetRequest(`/1/boards/${boardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return board;
  }

  async getListById(listId: string): Promise<TrelloList> {
    const list = await this.trelloApiGetRequest(`/1/lists/${listId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return list;
  }

  getBoards(starredBoards?: boolean): Promise<TrelloBoard[]> {
    const res = this.trelloApiGetRequest("/1/members/me/boards", {
      filter: starredBoards ? "starred" : "all",
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return res;
  }

  getListsFromBoard(boardId: string): Promise<TrelloList[]> {
    const res = this.trelloApiGetRequest(`/1/boards/${boardId}/lists`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return res;
  }

  getUsersFromBoard(boardId: string): Promise<TrelloMember[]> {
    const res = this.trelloApiGetRequest(`/1/boards/${boardId}/members`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return res;
  }

  getUsersOnCard(cardId: string): Promise<TrelloMember[]> {
    const res = this.trelloApiGetRequest(`/1/card/${cardId}/members?fields=all`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return res;
  }

  getCardsFromList(listId: string): Promise<TrelloCard[]> {
    const res = this.trelloApiGetRequest(`/1/lists/${listId}/cards`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      attachments: "cover",
      actions: "commentCard",
      actions_limit: 20,
      members: true,
    });
    return res;
  }

  getCardById(cardId: string): Promise<TrelloCard> {
    const res = this.trelloApiGetRequest(`/1/cards/${cardId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return res;
  }

  getChecklistById(checklistId: string): Promise<TrelloChecklist> {
    const res = this.trelloApiGetRequest(`/1/checklists/${checklistId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    return res;
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

  setFavoriteListByClick(list: TrelloItem): void {
    if (!list) {
      vscode.window.showErrorMessage("Could not get valid list");
      return;
    }
    this.globalState.update(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID, list.id);
    this.getFavoriteList();
    vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
  }

  resetFavoriteList(): void {
    this.globalState.update(GLOBALSTATE_CONFIG.FAVORITE_LIST_ID, null);
    this.getFavoriteList();
    vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
  }

  async addCardToList(list: TrelloItem): Promise<Number> {
    if (!list) {
      vscode.window.showErrorMessage("Could not get valid list");
      return 1;
    }
    const cardName = await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: "Enter name of card" });
    if (cardName === undefined) return 2;

    const resData = await this.trelloApiPostRequest("/1/cards", {
      key: this.API_KEY,
      token: this.API_TOKEN,
      idList: list.id,
      name: cardName,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (list.id === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Created Card: ${resData.idShort}-${resData.name}`, resData.shortUrl);
    return 0;
  }

  async editTitle(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid card");
      return 1;
    }
    const trelloCard: TrelloCard = await this.getCardById(card.id);
    const name = await vscode.window.showInputBox({ ignoreFocusOut: true, value: trelloCard.name });
    if (name === undefined) return 2;

    const resData = await this.trelloApiPutRequest(`/1/cards/${card.id}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      name,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Updated title for card: ${resData.name}`);
    return 0;
  }

  async editDescription(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid card");
      return 1;
    }
    const trelloCard: TrelloCard = await this.getCardById(card.id);
    // parse new line chars and remove quotes from start and end
    let descRaw = JSON.stringify(trelloCard.desc);
    descRaw = descRaw.slice(1, descRaw.length - 1);

    const descUpdated = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      value: descRaw,
      placeHolder: "Enter description for card",
    });
    if (descUpdated === undefined) return 2;

    // replaces "\n" with javascript return character required for Trello api
    const desc = descUpdated.replace(/\\n/g, "\x0A");

    const resData = await this.trelloApiPutRequest(`/1/cards/${card.id}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      desc,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Updated description for card: ${resData.name}`);
    return 0;
  }

  async addComment(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid card");
      return 1;
    }

    const comment = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Add comment",
    });
    if (comment === undefined) return 2;

    const resData = await this.trelloApiPostRequest(`/1/cards/${card.id}/actions/comments`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      text: comment,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Added comment to card: ${resData.data.card.name}`);
    return 0;
  }

  private getSelf(): Promise<TrelloMember> {
    return this.trelloApiGetRequest(`/1/members/me`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
  }

  async addSelfToCard(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid Card");
      return 1;
    }
    const user: TrelloMember = await this.getSelf();

    const resData = await this.trelloApiPostRequest(`/1/cards/${card.id}/idMembers`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      value: user.id,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Added user ${user.initials} to card`);
    return 0;
  }

  async removeSelfFromCard(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid Card");
      return 1;
    }
    const user: TrelloMember = await this.getSelf();

    const resData = await this.trelloApiDeleteRequest(`/1/cards/${card.id}/idMembers/${user.id}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Removed user ${user.initials} from card`);
    return 0;
  }

  async addUserToCard(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid Card");
      return 1;
    }

    const usersOnBoard = await this.getUsersFromBoard(card.boardId || "-1");
    if (!usersOnBoard) return 3;

    const quickPickUsers = usersOnBoard.map(user => {
      return {
        label: user.fullName,
        userId: user.id,
      };
    });

    const addUser = await vscode.window.showQuickPick(quickPickUsers, { placeHolder: "Add user from board:" });
    if (addUser === undefined) return 2;

    const resData = await this.trelloApiPostRequest(`/1/cards/${card.id}/idMembers`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      value: addUser.userId,
    });
    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Added user ${addUser.label} to card`);
    return 0;
  }

  async removeUserFromCard(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid Card");
      return 1;
    }

    const usersOnCard = await this.getUsersOnCard(card.id);
    if (!usersOnCard) return 3;

    const quickPickUsers = usersOnCard.map(user => {
      return {
        label: user.fullName,
        userId: user.id,
      };
    });
    const removeUser = await vscode.window.showQuickPick(quickPickUsers, { placeHolder: "Remove user from board:" });
    if (removeUser === undefined) return 2;

    const resData = await this.trelloApiDeleteRequest(`/1/cards/${card.id}/idMembers/${removeUser.userId}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
    });
    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Removed user ${removeUser.label} from card`);
    return 0;
  }

  async moveCardToList(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid card");
      return 1;
    }

    const listsForBoard = await this.getListsFromBoard(card.boardId || "-1");
    if (!listsForBoard) return 3;

    const quickPickLists = listsForBoard.map(list => {
      return {
        label: list.name,
        listId: list.id,
      };
    });

    const toList = await vscode.window.showQuickPick(quickPickLists, { placeHolder: "Move card to list:" });
    if (toList === undefined) return 2;

    const resData = await this.trelloApiPutRequest(`/1/cards/${card.id}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      idList: toList.listId,
    });
    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID || toList.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Moved card to list: ${toList.label}`);
    return 0;
  }

  async archiveCard(card: TrelloItem): Promise<Number> {
    if (!card) {
      vscode.window.showErrorMessage("Could not get valid card");
      return 1;
    }
    const resData = await this.trelloApiPutRequest(`/1/cards/${card.id}`, {
      key: this.API_KEY,
      token: this.API_TOKEN,
      closed: true,
    });

    if (!resData) return 3;

    vscode.commands.executeCommand("trelloViewer.refresh");
    if (card.listId === this.FAVORITE_LIST_ID) {
      vscode.commands.executeCommand("trelloViewer.refreshFavoriteList");
    }

    this.showSuccessMessage(`Archived Card: ${resData.idShort}-${resData.name}`, resData.shortUrl);
    return 0;
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
    return content ? `## **\`${header}\`** \n${content}\n\n--- \n` : "";
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
