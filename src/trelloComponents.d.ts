export interface CheckItem {
  id: string;
  state: string;
  name: string;
}

// TODO move trelloBoards object to this structure
export interface TrelloObject {
  trelloBoards: TrelloBoard[];
}

export interface TrelloBoard {
  id: string;
  trelloLists: TrelloList[];
}

export interface TrelloList {
  id: string;
  trelloCards: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  trelloChecklist: TrelloChecklist[];
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: CheckItem[];
}
