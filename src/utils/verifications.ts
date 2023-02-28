import { VerifiablePresentation } from '../models/VerifiablePresentation';
import { VerifiableCredential, Issuer } from '../models/VerifiableCredential';
import { VerificationMethod } from '../models/VerificationMethod';
import { recoverAddress, recoverEip712TypedSignatureV4 } from '../utils/cryptography';
import { isIssuerForAddress, isP2PBadgeTemplate } from '../utils/contract';
import { getJsonDataFromUrl } from '../utils/http';
import { Web3Provider } from '../web3Provider';
import bs58 from 'bs58';

const RESOLVER_URL = 'https://resolver.mydid.eu/1.0/identifiers/';

export async function verifyVerifiablePresentation(verifiablePresentation: VerifiablePresentation): Promise<boolean> {
  const { proof, ...VPWithoutProof } = verifiablePresentation;

  // Retrieve signer address from DID document
  let signerAddress: string = null;

  const [did, tag] = proof.verificationMethod.split('#');
  const testnet = Web3Provider.getInstance().getChainId() == 0x61;

  const method: VerificationMethod = (await getJsonDataFromUrl(
    `${RESOLVER_URL}${did}?tag=${tag}${testnet ? '&network=testnet' : ''}`
  )) as VerificationMethod;
  if (method.type == 'EcdsaSecp256k1RecoveryMethod2020') {
    signerAddress = method.blockchainAccountId.split(':')[2];
  }
  if (!signerAddress) throw `Can't retrieve address from resolver`;

  // Verify proof signature
  let recoveredAddress: string = null;
  const document =
    (verifiablePresentation.verifiableCredential ? JSON.stringify(VPWithoutProof) : '') +
    proof.domain +
    proof.challenge;
  if (proof.type == 'EcdsaSecp256k1Signature2019') {
    recoveredAddress = recoverAddress(proof.signatureValue, document);
  }
  if (recoveredAddress != signerAddress) throw 'Bad signature for verifiable presentation';

  return true;
}

export async function verifyVerifiableCredential(verifiableCredential: VerifiableCredential): Promise<void[]> {
  return Promise.all([
    verifyVC(verifiableCredential),
    ...((verifiableCredential.issuer as Issuer).endorsement
      ? [verifyVC((verifiableCredential.issuer as Issuer).endorsement)]
      : []),
  ]);
}

export async function verifyVC(verifiableCredential: VerifiableCredential): Promise<void> {
  const { proof, ...VCWithoutProof } = verifiableCredential;

  let isIssuer = false;
  let isP2P = false;
  let templateData = null;
  let type = null;

  // Define VC type
  if (verifiableCredential.type.length == 1 && verifiableCredential.type.indexOf('VerifiableCredential') != -1)
    type = 'VerifiableCredential';
  else if (verifiableCredential.type.length == 2 && verifiableCredential.type.indexOf('OpenBadgeCredential') != -1)
    type = 'OpenBadgeCredential';
  else if (verifiableCredential.type.length == 2 && verifiableCredential.type.indexOf('EndorsementCredential') != -1)
    type = 'EndorsementCredential';
  else throw `VC type not handled`;

  // Verify VC sender is VC signer
  if (
    !(
      verifiableCredential.proof.verificationMethod.split('#')[0] == verifiableCredential.issuer ||
      verifiableCredential.proof.verificationMethod.split('#')[0] ==
        (verifiableCredential.issuer as Issuer).id.split('#')[0]
    )
  ) {
    throw `Sender and signer are different in VC`;
  }

  await Promise.all([
    // Verify VC signature
    new Promise(async (resolve) => {
      // Retrieve signer address from DID document
      let signerAddress: string = null;

      const [did, tag] = proof.verificationMethod.split('#');
      const testnet = Web3Provider.getInstance().getChainId() == 0x61;

      const method: VerificationMethod = (await getJsonDataFromUrl(
        `${RESOLVER_URL}${did}?tag=${tag}${testnet ? '&network=testnet' : ''}`
      )) as VerificationMethod;
      if (method.type == 'EcdsaSecp256k1RecoveryMethod2020') {
        signerAddress = method.blockchainAccountId.split(':')[2];
      }
      if (!signerAddress) throw `Can't retrieve address from resolver`;

      // Verify proof signature
      let recoveredAddress: string = null;
      if (proof.type == 'EcdsaSecp256k1Signature2019') {
        recoveredAddress = recoverAddress(proof.signatureValue, JSON.stringify(VCWithoutProof));
      } else if (proof.type == 'EthereumEip712Signature2021') {
        recoveredAddress = await recoverEip712TypedSignatureV4(verifiableCredential);
      }
      if (recoveredAddress != signerAddress) throw 'Bad signature for verifiable credential';
      resolve({});
    }),
    // Get sender role
    new Promise(async (resolve) => {
      isIssuer = await isIssuerForAddress(
        verifiableCredential.proof.verificationMethod.split('#')[0].replace('DID:SDI:', '')
      );
      resolve({});
    }),
    // Get P2P info
    ...(verifiableCredential.templateHash
      ? [
          new Promise(async (resolve) => {
            isP2P = await isP2PBadgeTemplate(verifiableCredential.templateHash);
            resolve({});
          }),
        ]
      : []),
    // Get template data
    ...(verifiableCredential.templateHash
      ? [
          new Promise(async (resolve) => {
            const cleanHash = (verifiableCredential.templateHash + '').replace('0x', '');
            const bytes = Buffer.from('1220' + cleanHash, 'hex');
            const cid = bs58.encode(bytes);
            templateData = await getJsonDataFromUrl('https://myntfsid.mypinata.cloud/ipfs/' + cid);
            resolve({});
          }),
        ]
      : []),
  ]);

  // Check that endorsment is not P2P
  if (type == 'EndorsementCredential' && isP2P) throw `Endorsement credential can't be P2P`;

  // Validate template
  if (type == 'EndorsementCredential') {
    if (templateData.name != verifiableCredential.credentialSubject.endorsementComment.split('::')[0]) {
      throw 'Badge does not correspond to template';
    }
  } else if (type == 'OpenBadgeCredential') {
    if (
      templateData.name != verifiableCredential.credentialSubject.achievement.name ||
      templateData.description != verifiableCredential.credentialSubject.achievement.description ||
      templateData.criteria.narrative != verifiableCredential.credentialSubject.achievement.criteria.narrative ||
      templateData.criteria.id != verifiableCredential.credentialSubject.achievement.criteria.id
    ) {
      throw 'Badge does not correspond to template';
    }
  }

  // Validate badge issuer
  if (['EndorsementCredential', 'OpenBadgeCredential'].indexOf(type) != -1 && !isP2P) {
    if (!isIssuer) throw `Badge issued by a non-issuer`;
    if (templateData.issuerDID.split('#')[0] != verifiableCredential.proof.verificationMethod.split('#')[0])
      throw `Issuer doesn't own badge template`;
  }

  // Validate VC issuer
  if (type == 'VerifiableCredential' && !isIssuer) throw `VC issued by a non-issuer`;

  return;
}
