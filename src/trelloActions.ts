import * as extension from "./extension";
import * as vscode from "vscode";

// @ts-ignore
import * as keys from "./config/keys";

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "vscode-trello";

const key = keys.my_API_key;
// const secret = keys.my_OAuth_secret;
