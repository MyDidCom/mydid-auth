import { Web3Provider } from '../web3Provider';
import { DIDDocument } from '../models/DIDDocument';
import createKeccakHash from 'keccak';

export async function getDIDDocumentForAddress(address: string): Promise<DIDDocument> {
  const response = await Web3Provider.getInstance().getContract().methods.getDID(address).call();
  return response && response['0'] == address ? new DIDDocument(response[0], response[1], response[2]) : null;
}

export async function isIssuerForAddress(address: string): Promise<boolean> {
  return Web3Provider.getInstance()
    .getContract()
    .methods.hasRole(createKeccakHash('keccak256').update('ISSUER_ROLE').digest(), address)
    .call();
}

export async function isP2PBadgeTemplate(hash: string): Promise<boolean> {
  return Web3Provider.getInstance().getContract().methods.isP2PBadgeTemplate(hash).call();
}
