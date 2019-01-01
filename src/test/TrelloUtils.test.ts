import * as assert from "assert";
import { TrelloUtils } from "../trello/TrelloUtils";
import * as sinon from "sinon";

suite("TrelloUtils", () => {
  // Avoid console error from globalState.get()
  const consoleErrorSandbox = sinon.createSandbox();
  consoleErrorSandbox.stub(console, "error");
  let trello: TrelloUtils = new TrelloUtils();
  consoleErrorSandbox.restore();

  suite("VS Code", () => {
    const API_KEY = "SomeApiKey123";
    const API_TOKEN = "SomeApiToken12345";
    test("SetTrelloCredential correctly resolves key and token", async () => {
      const setTrelloCredentialStub = sinon.stub(trello, "setTrelloCredential");
      setTrelloCredentialStub.onCall(0).returns(Promise.resolve(API_KEY));
      setTrelloCredentialStub.onCall(1).returns(Promise.resolve(API_TOKEN));
      const apiKeyPromise = trello.setTrelloCredential(false, "Your Trello API key");
      const apiTokenPromise = trello.setTrelloCredential(true, "Your Trello API token");

      const resApiKey = await apiKeyPromise.then();
      const resApiToken = await apiTokenPromise.then();

      assert.equal(resApiKey, API_KEY);
      assert.equal(resApiToken, API_TOKEN);
    });
  });

  suite("Trello API", () => {
    const BOARD_ID = "5c2b3cdaa0696d3fd39d776e";
    const LIST_ID = "5c2b3d25a9970548e6e38318";
    const CARD_ID = "5c2b3d3ae3d7314d2876f4fd";

    test("getBoardById returns board data", async () => {
      const trelloBoard = await trello.getBoardById(BOARD_ID, false);
      assert.equal(trelloBoard.id, BOARD_ID);
      assert.equal(typeof trelloBoard.name, "string");
    });

    test("getListById returns list data", async () => {
      const trelloList = await trello.getListById(LIST_ID, false);
      assert.equal(trelloList.id, LIST_ID);
      assert.equal(typeof trelloList.name, "string");
      assert.equal(trelloList.idBoard, BOARD_ID);
    });

    test("getCardById returns card data", async () => {
      const trelloCard = await trello.getCardById(CARD_ID, false);
      assert.equal(trelloCard.id, CARD_ID);
      assert.equal(typeof trelloCard.name, "string");
      assert.equal(typeof trelloCard.url, "string");
      assert.equal(typeof trelloCard.desc, "string");
      assert.equal(trelloCard.idChecklists.length >= 0, true);
    });

    test("getListsFromBoard returns list as array", async () => {
      const trelloLists = await trello.getListsFromBoard(BOARD_ID, false);
      assert.equal(trelloLists[0].id, LIST_ID);
    });

    test("getCardsFromList returns card as array", async () => {
      const trelloCards = await trello.getCardsFromList(LIST_ID, false);
      assert.equal(trelloCards[0].id, CARD_ID);
    });

    test("getBoards returns null if credentials not provided", async () => {
      const trelloBoards = await trello.getBoards(false);
      assert.equal(trelloBoards, null);
    });
  });
});
