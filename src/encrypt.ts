// Credit to https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
import * as crypto from "crypto";
import { ENCRYPT } from "./constants";

export function encrypt(text: any) {
  if (!text) return undefined;
  try {
    const iv = crypto.randomBytes(ENCRYPT.IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPT.ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (err) {
    console.error(err);
  }
}

export function decrypt(text: string) {
  if (!text) return undefined;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift() || '', "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPT.ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (err) {
    console.error(err);
  }
}
