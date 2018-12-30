import { GlobalStateConfig } from "./trelloComponents";

export const VSCODE_VIEW_COLUMN = [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const TEMP_TRELLO_FILE_NAME = "~vscodeTrello.md";

export const TRELLO_API_BASE_URL = "https://api.trello.com";

export const SETTING_PREFIX = "trelloViewer";

export const SETTING_CONFIG = {
  VIEW_COLUMN: "viewColumn",
  DEFAULT_VIEW_COLUMN: 2,
  STARRED_BOARDS:   "starredBoardsOnly",
  DEFAULT_STARRED_BOARDS: true,
};

export const GLOBALSTATE_CONFIG: GlobalStateConfig = {
  API_KEY: "trelloViewerApiKey",
  API_TOKEN: "trelloViewerApiToken",
  FAVORITE_LIST_ID: "trelloViewerFavoriteListId",
};

export const TRELLO_ITEM_TYPE = {
  BOARD: "board",
  LIST: "list",
  CARD: "card",
};

export const ENCRYPTION_KEY = 'jwkEfG4!n&UAv2jG!L$54uJfmTSUae8D';
