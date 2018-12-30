import * as assert from "assert";
import { encrypt, decrypt } from "../common/encrypt";

suite("encrypt and decrypt functions", () => {
  const text = "pa55w0rd";
  const encrytedText = encrypt(text) || "";

  test("Encrypted text has correct length", () => {
    const splitEncrytedText = encrytedText.split(":");
    assert.equal(splitEncrytedText[0].length, 32);
    assert.equal(splitEncrytedText[1].length, 32);
  });

  test("Correctly decrpyts text", () => {
    const decryptedText = decrypt(encrytedText) || "";
    assert.equal(decryptedText, text);
  });
});
