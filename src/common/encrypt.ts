// Credit to https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
import * as crypto from "crypto";
import { ENCRYPTION_KEY } from "../trello/constants";

export function encrypt(text: any) {
  if (!text) return undefined;

  const IV_LENGTH = 16; // For AES, this is always 16
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string) {
  if (!text) return undefined;

  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift() || '', "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
