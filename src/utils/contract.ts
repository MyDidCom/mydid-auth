import { Web3Provider } from "../web3Provider";
import { DIDDocument } from "../models/DIDDocument";

export async function getDIDDocumentForAddress(address: string): Promise<DIDDocument> {
  var response = null;
  try {
    response = await Web3Provider.getInstance().getContract().methods.getDID(address).call();
  } catch (e) {
    console.log(e);
  }
  return response ? new DIDDocument(response[0], response[1], response[2]) : null;
}

export async function isIssuerForAddress(address: string): Promise<boolean> {
  var response = null;
  try {
    response = await Web3Provider.getInstance().getContract().methods.isIssuer(address).call();
  } catch (e) {
    console.log(e);
  }
  return response;
}
