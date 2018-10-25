import * as extension from "./extension";
import * as vscode from "vscode";

// @ts-ignore
import * as keys from "./config/keys";

import { OAuth } from "oauth";
import * as url from "url";

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "vscode-trello";

const key = keys.my_API_key;
const secret = keys.my_OAuth_secret;
const oauth = new OAuth(
  requestURL,
  accessURL,
  key,
  secret,
  "1.0A",
  null,
  "HMAC-SHA1"
);

const oauth_secrets = {};

// @ts-ignore
export function login(request, response) {
  // @ts-ignore
  oauth.getOAuthRequestToken((error, token, tokenSecret, results) => {
    // @ts-ignore
    oauth_secrets[token] = tokenSecret;
    // response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}`);
  });
}

// @ts-ignore
export function callback(req, res) {
  const query = url.parse(req.url, true).query;
  const token = query.oauth_token;
  // @ts-ignore
  const tokenSecret = oauth_secrets[token];
  const verifier = query.oauth_verifier;
  // @ts-ignore
  oauth.getOAuthAccessToken(token, tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results){
    // In a real app, the accessToken and accessTokenSecret should be stored
    oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, function(error, data, response){
      // Now we can respond with data to show that we have access to your Trello account via OAuth
      res.send(data);
    });
  });

  // oauth.get(
  //   "https://api.trello.com/1/members/me",
  // // @ts-ignore
  //   token, //test user token
  //   tokenSecret, //test user secret
  // // @ts-ignore
  //   function(e, data, res) {
  //     if (e) {
  //       console.error(e);
  //     }
  //     console.log(require("util").inspect(data));
  // // @ts-ignore
  //     done();
  //   }
  // );
}
