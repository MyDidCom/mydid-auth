import { VerifiablePresentation } from "../models/VerifiablePresentation";
import { VerifiableCredential } from "../models/VerifiableCredential";
import { recoverAddress, recoverTypedSignatureV4 } from "../utils/cryptography";
import { getDIDDocumentForAddress, isIssuerForAddress } from "../utils/contract";

export async function checkVPSignature(verifiablePresentation: VerifiablePresentation): Promise<boolean> {
  try {
    const { proof, ...VPWithoutProof } = verifiablePresentation;
    const signerDidDocument = await getDIDDocumentForAddress(cleanAddress(proof.verificationMethod));
    if (!signerDidDocument || !signerDidDocument.address)
      throw "Can't retrieve signer did document (checking VC signature)";
    const document =
      (verifiablePresentation.verifiableCredential ? JSON.stringify(VPWithoutProof) : "") +
      proof.domain +
      proof.challenge;
    const recoveredAddress = recoverAddress(proof.signatureValue, document);
    return recoveredAddress == signerDidDocument.address;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function checkVCSignature(verifiableCredential: VerifiableCredential): Promise<boolean> {
  try {
    const { proof, ...VCWithoutProof } = verifiableCredential;
    const signerDidDocument = await getDIDDocumentForAddress(cleanAddress(proof.verificationMethod));
    if (!signerDidDocument || !signerDidDocument.address)
      throw "Can't retrieve signer did document (checking VC signature)";

    let recoveredAddress = "";
    if (proof.type == "eth_signTypedData_v4") {
      recoveredAddress = recoverTypedSignatureV4(VCWithoutProof, proof.signatureValue);
    } else if (proof.type == "EcdsaSecp256k1Signature2019") {
      recoveredAddress == recoverAddress(proof.signatureValue, JSON.stringify(VCWithoutProof));
    }

    return recoveredAddress == signerDidDocument.address;
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
