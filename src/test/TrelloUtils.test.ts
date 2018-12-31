import * as assert from "assert";
import { TrelloUtils } from "../trello/TrelloUtils";
import * as sinon from "sinon";

suite("TrelloUtils", () => {
  let trello: TrelloUtils = new TrelloUtils();

  test("SetTrelloCredential correctly resolves key and token", async () => {
    const setTrelloCredentialStub = sinon.stub(trello, "setTrelloCredential");
    setTrelloCredentialStub.onCall(0).returns(Promise.resolve('SomeApiKey123'));
    setTrelloCredentialStub.onCall(1).returns(Promise.resolve('SomeApiToken12345'));
    const testApiKey = trello.setTrelloCredential(false, "Your Trello API key");
    const testApiToken = trello.setTrelloCredential(true, "Your Trello API token");

    const resApiKey = await testApiKey.then();
    const resApiToken = await testApiToken.then();

    assert.equal(resApiKey, 'SomeApiKey123');
    assert.equal(resApiToken, 'SomeApiToken12345');
  });

});

