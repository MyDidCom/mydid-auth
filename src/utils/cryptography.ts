import { Web3Provider } from "../web3Provider";
import { BinaryToTextEncoding } from "crypto";
import crypto from "crypto";

export function recoverAddress(signature: string, document: string): string {
  const messageHash = hashSHA256(document);
  const v = "0x" + signature.slice(0, 2); // 2 chars, 1B => '0x1b'
  const r = "0x" + signature.slice(2, 66); // 64 chars, 1B
  const s = "0x" + signature.slice(66, 130); // 64 chars, 1B
  try {
    return Web3Provider.getInstance().web3.eth.accounts.recover({ messageHash, v, r, s }).toLowerCase();
  } catch (e) {
    return null;
  }
}

export function hashSHA256(message: string): string {
  return (
    "0x" +
    crypto
      .createHash("sha256")
      .update(message)
      .digest("hex" as BinaryToTextEncoding)
  );
}
