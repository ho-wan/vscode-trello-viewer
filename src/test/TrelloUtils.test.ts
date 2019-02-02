import * as assert from "assert";
import * as sinon from "sinon";
import axios, { AxiosPromise } from "axios";

import { TrelloUtils } from "../trello/TrelloUtils";
import { TrelloCard, TrelloList, TrelloBoard } from "../trello/trelloComponents";

suite("TrelloUtils", () => {
  // Use sandbox to avoid console error from globalState.get()
  const consoleErrorSandbox = sinon.createSandbox();
  consoleErrorSandbox.stub(console, "error");
  let trello: TrelloUtils = new TrelloUtils();
  consoleErrorSandbox.restore();

  suite("VS Code", () => {
    const API_KEY = "SomeApiKey";
    const API_TOKEN = "SomeApiToken";
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
    const trelloApiGetRequestStub = sinon.stub(trello, "trelloApiGetRequest");

    suite("Trello API", () => {
      const BOARD_ID = "123";
      const LIST_ID = "456";
      const CARD_ID = "789";

      setup(() => {
        trelloApiGetRequestStub.reset();
      });

      suiteTeardown(() => {
        trelloApiGetRequestStub.restore();
      });

      test("getBoardById returns mock board data", async () => {
        const data = new Promise(r =>
          r({
            id: BOARD_ID,
            name: "test_board",
          })
        );
        trelloApiGetRequestStub.returns(data);
        const trelloBoard: TrelloBoard = await trello.getBoardById(BOARD_ID);

        assert.equal(trelloBoard.id, BOARD_ID);
        assert.equal(trelloBoard.name, "test_board");
      });

      test("getListById returns mock list data", async () => {
        const data = new Promise(r =>
          r({
            id: LIST_ID,
            name: "test_list",
            idBoard: BOARD_ID,
          })
        );
        trelloApiGetRequestStub.returns(data);
        const trelloList: TrelloList = await trello.getListById(LIST_ID);

        assert.equal(trelloList.id, LIST_ID);
        assert.equal(trelloList.name, "test_list");
        assert.equal(trelloList.idBoard, BOARD_ID);
      });

      test("getCardById returns mock card data", async () => {
        const data = new Promise(r =>
          r({
            id: CARD_ID,
            idShort: 1,
            name: "test_card",
            attachments: [
              {
                url: "test_attachment_url",
              },
            ],
            url: "test_url",
            desc: "test_desc",
            idChecklists: ["checklist_id_1", "checklist_id_2"],
          })
        );
        trelloApiGetRequestStub.returns(data);
        const trelloCard: TrelloCard = await trello.getCardById(CARD_ID);

        assert.equal(trelloCard.id, CARD_ID);
        assert.equal(trelloCard.idShort, '1');
        assert.equal(trelloCard.attachments[0].url, "test_attachment_url");
        assert.equal(trelloCard.name, "test_card");
        assert.equal(trelloCard.url, "test_url");
        assert.equal(trelloCard.desc, "test_desc");
        assert.equal(trelloCard.idChecklists[0], "checklist_id_1");
        assert.equal(trelloCard.idChecklists[1], "checklist_id_2");
      });

      test("getListsFromBoard returns list as array", async () => {
        const data = new Promise(r =>
          r([
            {
              id: "list_id_1",
              name: "test_list_1",
              idBoard: BOARD_ID,
            },
            {
              id: "list_id_2",
              name: "test_list_2",
              idBoard: BOARD_ID,
            },
          ])
        );
        trelloApiGetRequestStub.returns(data);
        const trelloLists: TrelloList[] = await trello.getListsFromBoard(BOARD_ID);
        assert.equal(trelloLists[0].id, "list_id_1");
        assert.equal(trelloLists[1].id, "list_id_2");
      });

      test("getCardsFromList returns card as array", async () => {
        const data = new Promise(r =>
          r([
            {
              id: "card_id_1",
              name: "test_card_1",
              desc: "test_desc_1",
            },
            {
              id: "card_id_2",
              name: "test_card_2",
              desc: "test_desc_2",
            },
          ])
        );
        trelloApiGetRequestStub.returns(data);
        const trelloCards = await trello.getCardsFromList(LIST_ID);
        assert.equal(trelloCards[0].id, "card_id_1");
        assert.equal(trelloCards[1].id, "card_id_2");
      });
    });

    suite("trelloApiGetRequest", () => {
      const credentialsStub = sinon.stub(trello, "isCredentialsProvided");

      suiteSetup(() => {
        trelloApiGetRequestStub.restore();
      });

      setup(() => {
        credentialsStub.reset();
      });

      suiteTeardown(() => {
        credentialsStub.restore();
      });

      test("trelloApiGetRequest returns null if no credentials", async () => {
        credentialsStub.returns(false);
        const response = await trello.trelloApiGetRequest("test_id", {});
        assert.equal(response, null);
      });

      test("trelloApiGetRequest returns response with correct data", async () => {
        credentialsStub.returns(true);
        const mockResponse: AxiosPromise = new Promise(r =>
          r({
            data: {
              id: "123",
              desc: "test_description",
            },
            status: 200,
            statusText: "Ok",
            headers: "test_headers",
            config: {},
          })
        );
        sinon.stub(axios, "get").returns(mockResponse);
        const response = await trello.trelloApiGetRequest("test_id", {});
        assert.deepEqual(response, {
          id: "123",
          desc: "test_description",
        });
      });
    });
  });
});
