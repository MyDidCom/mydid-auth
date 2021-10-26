import { VerifiablePresentation } from "../models/VerifiablePresentation";
import { VerifiableCredential } from "../models/VerifiableCredential";
import { recoverAddress } from "../utils/cryptography";
import { getDIDDocumentForAddress, isIssuerForAddress } from "../utils/contract";

export async function checkVPSignature(verifiablePresentation: VerifiablePresentation): Promise<boolean> {
  const { proof, ...VPWithoutProof } = verifiablePresentation;
  const verificationMethod = (
    await getDIDDocumentForAddress(cleanAddress(proof.verificationMethod))
  ).address;
  const document =
    (verifiablePresentation.verifiableCredential ? JSON.stringify(VPWithoutProof) : "") +
    proof.domain +
    proof.challenge;
  const recoveredAddress = recoverAddress(proof.signatureValue, document);
  return verificationMethod == recoveredAddress;
}

export async function checkVCSignature(verifiableCredential: VerifiableCredential): Promise<boolean> {
  const { proof, ...VCWithoutProof } = verifiableCredential;
  const verificationMethod = (
    await getDIDDocumentForAddress(cleanAddress(proof.verificationMethod))
  ).address;
  const document = JSON.stringify(VCWithoutProof);
  return verificationMethod == recoverAddress(proof.signatureValue, document);
}

export async function checkVCIssuer(verifiableCredential: VerifiableCredential): Promise<boolean> {
  const issuerAddress = cleanAddress(verifiableCredential.issuer);
  return await isIssuerForAddress(issuerAddress);
}

function cleanAddress(DID: string) {
  const address = DID.split(":")[2];
  const addressWithoutKey = address.split("#")[0];
  return addressWithoutKey;
}
