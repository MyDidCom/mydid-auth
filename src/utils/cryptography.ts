import crypto from "crypto";
import { BinaryToTextEncoding } from "crypto";
import { Web3Provider } from "../web3Provider";

export function recoverAddress(signature: string, document: string): string {
  const messageHash = hashSHA256(document);
  const v = "0x" + signature.slice(0, 2);
  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  return Web3Provider.getInstance().web3.eth.accounts.recover({ messageHash, v, r, s });
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
