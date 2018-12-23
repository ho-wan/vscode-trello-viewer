export interface TrelloObject {
  trelloBoards: TrelloBoard[];
}

export interface TrelloBoard {
  id: string;
  name: string;
  trelloLists: TrelloList[];
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  trelloCards: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  name: string;
  attachments: Array<{
    url: string;
  }>;
  url: string;
  desc: string;
  idChecklists: string[];
  trelloChecklists: TrelloChecklist[];
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: CheckItem[];
}

export interface CheckItem {
  id: string;
  state: string;
  name: string;
}
