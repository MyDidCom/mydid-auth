import crypto from 'crypto';
import { BinaryToTextEncoding } from 'crypto';
import { Web3Provider } from '../web3Provider';
import { toChecksumAddress } from 'ethereum-checksum-address';
import { recoverTypedSignature, TypedMessage, MessageTypes, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { VerifiableCredential } from '../models/VerifiableCredential';
import { getJsonDataFromUrl } from '../utils/http';

export function recoverAddress(signature: string, document: string): string {
  const cleanSignature = signature.replace('0x', '');
  const messageHash = hashSHA256(document);
  const r = '0x' + cleanSignature.slice(0, 64);
  const s = '0x' + cleanSignature.slice(64, 128);
  const v = '0x' + cleanSignature.slice(128);

  return Web3Provider.getInstance().web3.eth.accounts.recover({ messageHash, v, r, s });
}

export function hashSHA256(message: string): string {
  return (
    '0x' +
    crypto
      .createHash('sha256')
      .update(message)
      .digest('hex' as BinaryToTextEncoding)
  );
}

export async function recoverEip712TypedSignatureV4(vc: VerifiableCredential) {
  const { proof, ...vcWithoutProof } = vc;
  const eip712Schema = await getJsonDataFromUrl(proof.eip712.messageDataEip712Schema);

  const typedData = {
    domain: proof.eip712.domain,
    message: vcWithoutProof as object,
    primaryType: proof.eip712.primaryType,
    types: eip712Schema as MessageTypes,
  };

  return toChecksumAddress(
    recoverTypedSignature({
      data: typedData as TypedMessage<MessageTypes>,
      signature: proof.proofValue,
      version: SignTypedDataVersion.V4,
    })
  );
}
