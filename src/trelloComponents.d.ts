// TODO move trelloBoards object to this structure
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
  trelloCards: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  name: string;
  idChecklists: string[];
  trelloChecklist: TrelloChecklist[];
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
