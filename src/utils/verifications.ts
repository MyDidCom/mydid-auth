import { VerifiablePresentation } from "../models/VerifiablePresentation";
import { VerifiableCredential } from "../models/VerifiableCredential";
import { recoverAddress } from "../utils/cryptography";
import { getDIDDocumentForAddress, isIssuerForAddress } from "../utils/contract";

export async function checkVPSignature(verifiablePresentation: VerifiablePresentation): Promise<boolean> {
  try {
    const { proof, ...VPWithoutProof } = verifiablePresentation;
    const verificationMethod = (await getDIDDocumentForAddress(cleanAddress(proof.verificationMethod))).address;
    const document =
      (verifiablePresentation.verifiableCredential ? JSON.stringify(VPWithoutProof) : "") +
      proof.domain +
      proof.challenge;
    const recoveredAddress = recoverAddress(proof.signatureValue, document);
    return verificationMethod == recoveredAddress;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function checkVCSignature(verifiableCredential: VerifiableCredential): Promise<boolean> {
  try {
    const { proof, ...VCWithoutProof } = verifiableCredential;
    const verificationMethod = (await getDIDDocumentForAddress(cleanAddress(proof.verificationMethod))).address;
    const document = JSON.stringify(VCWithoutProof);
    return verificationMethod == recoverAddress(proof.signatureValue, document);
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function checkVCIssuer(verifiableCredential: VerifiableCredential): Promise<boolean> {
  try {
    return await isIssuerForAddress(cleanAddress(verifiableCredential.issuer));
  } catch (e) {
    console.log(e);
    return false;
  }
}

function cleanAddress(DID: string) {
  const address = DID.split(":")[2];
  const addressWithoutKey = address.split("#")[0];
  return addressWithoutKey;
}
