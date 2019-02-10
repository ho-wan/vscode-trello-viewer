export interface TrelloObject {
  trelloBoards: TrelloBoard[];
}

export interface TrelloBoard {
  id: string;
  name: string;
  trelloLists: TrelloList[];
  [key: string]: any;
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  trelloCards: TrelloCard[];
  [key: string]: any;
}

export interface TrelloCard {
  id: string;
  idShort: string;
  idBoard: string;
  idList: string;
  name: string;
  attachments: Array<{
    url: string;
  }>;
  url: string;
  desc: string;
  idChecklists: string[];
  trelloChecklists: TrelloChecklist[];
  actions: TrelloActionComment[];
  members: TrelloMember[];
  [key: string]: any;
}

export interface TrelloMember {
  id: string;
  initials: string;
}

export interface TrelloActionComment {
  id: string;
  date: string;
  data: {
    text: string;
    dateLastEdited: string;
  };
  memberCreator: {
    fullName: string;
  };
  [key: string]: any;
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: CheckItem[];
  [key: string]: any;
}

export interface CheckItem {
  id: string;
  state: string;
  name: string;
  pos: number;
  [key: string]: any;
}

export interface GlobalStateConfig {
  API_KEY: string;
  API_TOKEN: string;
  FAVORITE_LIST_ID: string;
  [key: string]: string;
}
