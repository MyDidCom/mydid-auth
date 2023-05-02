import crypto from 'crypto';
import { BinaryToTextEncoding } from 'crypto';
import createKeccakHash from 'keccak';
import { Web3Provider } from '../web3Provider';
import { toChecksumAddress } from 'ethereum-checksum-address';
import { base58btc } from 'multiformats/bases/base58';
import secp256k1 from 'secp256k1';
import { recoverTypedSignature, TypedMessage, MessageTypes, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { VerifiableCredential } from '../models/VerifiableCredential';
import { getJsonDataFromUrl } from '../utils/http';

export function recoverAddress(signature: string, document: string): string {
  const cleanSignature = base58btcToHex(signature).replace('0x', '');
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
      signature: base58btcToHex(proof.proofValue),
      version: SignTypedDataVersion.V4,
    })
  );
}

export function didToAddress(did: string): string {
  const didValue = did.split(':')[2];
  try {
    const publicKeyUintArray = base58btc.decode(didValue);
    const compressedPublicKey = Buffer.from(publicKeyUintArray).toString('hex');
    const decompressedBuffer = secp256k1.publicKeyConvert(Buffer.from(compressedPublicKey, 'hex'), false);
    const hash = createKeccakHash('keccak256').update(Buffer.from(decompressedBuffer).slice(1)).digest();
    const address = toChecksumAddress(hash.slice(-20).toString('hex'));
    return address;
  } catch (e) {
    return didValue;
  }
}

export function base58btcToHex(value: string): string {
  try {
    const byteArray = base58btc.decode(value);
    return '0x' + Buffer.from(byteArray).toString('hex');
  } catch (e) {
    return value;
  }
}
