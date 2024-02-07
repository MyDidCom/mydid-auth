import { VerifiablePresentation } from '../models/VerifiablePresentation';
import { VerifiableCredential, Issuer } from '../models/VerifiableCredential';
import { VerificationMethod } from '../models/VerificationMethod';
import { recoverAddress, recoverEip712TypedSignatureV4, didToAddress, base58btcToHex } from '../utils/cryptography';
import { isIssuerForAddress, isIssuerTemplate } from '../utils/contract';
import { getJsonDataFromUrl } from '../utils/http';
import { Web3Provider } from '../web3Provider';
import bs58 from 'bs58';

const RESOLVER_URL = 'https://resolver.mydid.eu/1.0/identifiers/';
const selfSignedVCs = ['pseudo', 'walletAddress', 'publicKey', 'did', 'authenticationKey', 'test'];

export async function verifyVerifiablePresentation(verifiablePresentation: VerifiablePresentation): Promise<boolean> {
  const { proof, ...VPWithoutProof } = verifiablePresentation;

  // Retrieve signer address from DID document
  let signerAddress: string = null;

  const [did, tag] = proof.verificationMethod.split('#');
  const chaindId = Web3Provider.getInstance().getChainId();

  const method: VerificationMethod = (await getJsonDataFromUrl(
    `${RESOLVER_URL}${did}?tag=${tag}&chainId=${chaindId}`
  )) as VerificationMethod;

  if (method.blockchainAccountId) {
    signerAddress = method.blockchainAccountId.split(':')[2];
  } else if (method.publicKeyMultibase) {
    signerAddress = base58btcToHex(method.publicKeyMultibase);
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
  const promiseArray = [];

  function recursiveVerify(verifiableCredential: VerifiableCredential): void {
    promiseArray.push(verifyVC(verifiableCredential));
    if ((verifiableCredential.issuer as Issuer).endorsement) {
      recursiveVerify((verifiableCredential.issuer as Issuer).endorsement);
    }
  }
  recursiveVerify(verifiableCredential);

  return Promise.all(promiseArray);
}

export async function verifyVC(verifiableCredential: VerifiableCredential): Promise<void> {
  const { proof, ...VCWithoutProof } = verifiableCredential;

  let isIssuer = false;
  let templateData = null;
  let type = null;
  let templateCategory = null;

  // Define VC type
  if (verifiableCredential.type.length == 1 && verifiableCredential.type.indexOf('VerifiableCredential') != -1)
    type = 'VerifiableCredential';
  else if (verifiableCredential.type.length == 2 && verifiableCredential.type.indexOf('OpenBadgeCredential') != -1)
    type = 'OpenBadgeCredential';
  else if (verifiableCredential.type.length == 2 && verifiableCredential.type.indexOf('EndorsementCredential') != -1)
    type = 'EndorsementCredential';
  else throw `VC type not handled`;

  // Define badge contract type
  if (verifiableCredential.templateHash) {
    if (type == 'EndorsementCredential') templateCategory = 4;
    else
      templateCategory = ['Basic', 'Community', 'Participation', 'Membership'].indexOf(
        verifiableCredential.credentialSubject.achievement.achievementType.replace('ext:', '')
      );
  }

  await Promise.all([
    // Verify VC signature
    new Promise(async (resolve, reject) => {
      // Retrieve signer address from DID document
      let signerAddress: string = null;

      const [did, tag] = proof.verificationMethod.split('#');
      const chaindId = Web3Provider.getInstance().getChainId();

      const method: VerificationMethod = (await getJsonDataFromUrl(
        `${RESOLVER_URL}${did}?tag=${tag}&chainId=${chaindId}`
      )) as VerificationMethod;
      if (method.blockchainAccountId) {
        signerAddress = method.blockchainAccountId.split(':')[2];
      } else if (method.publicKeyMultibase) {
        signerAddress = base58btcToHex(method.publicKeyMultibase);
      }

      if (!signerAddress) reject(`Can't retrieve address from resolver`);

      // Verify proof signature
      let recoveredAddress: string = null;
      if (proof.type == 'EcdsaSecp256k1Signature2019') {
        recoveredAddress = recoverAddress(proof.signatureValue, JSON.stringify(VCWithoutProof));
      } else if (proof.type == 'EthereumEip712Signature2021') {
        recoveredAddress = await recoverEip712TypedSignatureV4(verifiableCredential);
      }
      if (recoveredAddress != signerAddress) reject('Bad signature for verifiable credential');

      // For self-signed - verify credentialSubject id is issuer
      if (
        type == 'VerifiableCredential' &&
        verifiableCredential.credentialSubject.hasOwnProperty('award') &&
        selfSignedVCs.indexOf(verifiableCredential.credentialSubject['award'].split(';')[0]) != -1
      ) {
        if (signerAddress != didToAddress(verifiableCredential.credentialSubject.id)) {
          reject('Self-signed vc is not valid');
        }
      }

      resolve({});
    }),
    // Get sender role
    new Promise(async (resolve) => {
      isIssuer = await isIssuerForAddress(didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0]));
      resolve({});
    }),
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
    // Get template contract info (if not community badge)
    ...(verifiableCredential.templateHash && templateCategory != 1
      ? [
          new Promise(async (resolve, reject) => {
            // define template issuer address to verify
            let issuerAddress: string;
            if (
              (verifiableCredential.issuer as Issuer).endorsement &&
              (verifiableCredential.issuer as Issuer).endorsement.credentialSubject.endorsementComment.split('::')[0] ==
                'DELEGATION'
            ) {
              issuerAddress = didToAddress(
                (verifiableCredential.issuer as Issuer).endorsement.proof.verificationMethod.split('#')[0]
              );
            } else issuerAddress = didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0]);

            const templateInfoValid = await isIssuerTemplate(
              issuerAddress,
              templateCategory,
              verifiableCredential.templateHash
            );

            if (!templateInfoValid) {
              reject(`Can't retrieve template info from contract`);
            }

            resolve({});
          }),
        ]
      : []),
  ]);

  // Add template contract info verification if community
  if (templateCategory == 1) {
    const templateInfoValid = await isIssuerTemplate(
      didToAddress(templateData.issuerDID),
      templateCategory,
      verifiableCredential.templateHash
    );

    if (!templateInfoValid) {
      throw `Can't retrieve template info from contract`;
    }
  }

  // Validate badge content corresponding to badge template
  if (type == 'EndorsementCredential') {
    if (templateData && templateData.name != verifiableCredential.credentialSubject.endorsementComment.split('::')[1]) {
      throw 'Badge does not correspond to template';
    }
  } else if (type == 'OpenBadgeCredential') {
    if (templateData) {
      if (
        templateData.name != verifiableCredential.credentialSubject.achievement.name ||
        templateData.description != verifiableCredential.credentialSubject.achievement.description ||
        templateData.criteria != verifiableCredential.credentialSubject.achievement.criteria.narrative
      )
        throw 'Badge does not correspond to template';
      if (
        templateCategory == 2 &&
        (templateData.eventDetails.location != verifiableCredential.credentialSubject.achievement.location ||
          templateData.eventDetails.startDate != verifiableCredential.credentialSubject.achievement.startDate ||
          templateData.eventDetails.endDate != verifiableCredential.credentialSubject.achievement.endDate)
      )
        throw 'Badge does not correspond to participation template';
    }
  }
  // Validate badge sender corresponding to badge signer
  if (
    !(
      (typeof verifiableCredential.issuer === 'string' &&
        didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0]) ==
          didToAddress(verifiableCredential.issuer)) ||
      didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0]) ==
        didToAddress((verifiableCredential.issuer as Issuer).id.split('#')[0])
    )
  ) {
    throw `Sender and signer are different in VC`;
  }

  // Validate badge issuer
  if (['EndorsementCredential', 'OpenBadgeCredential'].indexOf(type) != -1) {
    if (!templateData) {
      // it's a delegation badge

      // check is delegation is issued by an issuer
      if (!isIssuer) throw `Badge issued by a non-issuer`;
    } else if (templateCategory != 1) {
      // it's a template-based badge and it's not a community badge

      // check is badge is issued by an issuer (except for community badge)
      if (!isIssuer) throw `Badge issued by a non-issuer`;

      // check if there is delegation
      if (
        (verifiableCredential.issuer as Issuer).endorsement &&
        (verifiableCredential.issuer as Issuer).endorsement.credentialSubject.endorsementComment.split('::')[0] ==
          'DELEGATION'
      ) {
        // there is a delegation

        // check if signature date is within delegation date range
        if (
          new Date(verifiableCredential.proof.created) <
            new Date((verifiableCredential.issuer as Issuer).endorsement.issuanceDate) ||
          new Date(verifiableCredential.proof.created) >
            new Date((verifiableCredential.issuer as Issuer).endorsement.expirationDate)
        ) {
          throw `Badge is not in delegation date range`;
        }

        // check if template issuerDID is same as delegation signer
        if (
          didToAddress(templateData.issuerDID.split('#')[0]) !=
          didToAddress((verifiableCredential.issuer as Issuer).endorsement.proof.verificationMethod.split('#')[0])
        )
          throw `Template issuer doesn't match delegation signer`;

        // check if template hash is allowed by delegation
        if (
          verifiableCredential.templateHash.replace('0x', '') !=
          (verifiableCredential.issuer as Issuer).endorsement.credentialSubject.endorsementComment.split('::')[2]
        ) {
          throw `Template hash is not allowed by delegation`;
        }
      } else {
        // there is no delegation

        // check if template issuerDID is same as badge signer
        if (
          didToAddress(templateData.issuerDID.split('#')[0]) !=
          didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0])
        )
          throw `Template issuer doesn't match signer`;
      }
    }
  } else if (type == 'VerifiableCredential') {
    // it's a basic attestation
    const selfSigned =
      verifiableCredential.credentialSubject.hasOwnProperty('award') &&
      selfSignedVCs.indexOf(verifiableCredential.credentialSubject['award'].split(';')[0]) != -1;
    if (!isIssuer && !selfSigned) throw `VC issued by a non-issuer`;
  }

  return;
}
