import { Web3Provider } from './web3Provider';
import { VerifiablePresentationRequest } from './models/VerifiablePresentationRequest';
import { VerifiablePresentation } from './models/VerifiablePresentation';
import { VerifiableCredential } from './models/VerifiableCredential';
import { isVerifiablePresentationSchema, isVerifiableCredentialSchema } from './utils/schema';
import { verifyVerifiablePresentation, verifyVerifiableCredential } from './utils/verifications';
import { didToAddress } from './utils/cryptography';

let authorizeVpSignedByIssuer = false;

const mydidAuth = {
  initialize: (config: object): void => {
    Web3Provider.getInstance().initialize(config['web3GivenProvider'], config['smartContractAddress']);
    authorizeVpSignedByIssuer = config['authorizeVpSignedByIssuer'];
  },

  createVPRequest: (challenge: string, domain: string, verifiableCredentials: string[]) => {
    return new VerifiablePresentationRequest(challenge, domain, verifiableCredentials);
  },

  validateVCConsistency: (VCData: object): void => {
    if (!isVerifiableCredentialSchema(VCData)) throw 'Incorrect format for verifiable credential';
    return;
  },

  validateVPConsistency: (VPData: object): void => {
    if (!isVerifiablePresentationSchema(VPData)) throw 'Incorrect format for verifiable presentation';

    const verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    let vpSignerIsSender = true;
    let vpSignerIsReceiver = true;

    if (verifiablePresentation.verifiableCredential) {
      for (const verifiableCredential of verifiablePresentation.verifiableCredential) {
        if (didToAddress(verifiableCredential.credentialSubject.id) != didToAddress(verifiablePresentation.id))
          vpSignerIsReceiver = false;
        if (
          didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0]) !=
          didToAddress(verifiablePresentation.proof.verificationMethod.split('#')[0])
        )
          vpSignerIsSender = false;
      }
    }

    if (
      (authorizeVpSignedByIssuer && !vpSignerIsReceiver && !vpSignerIsSender) ||
      (!authorizeVpSignedByIssuer && !vpSignerIsReceiver)
    )
      throw `Incorrect signer for verifiable presentation`;

    return;
  },

  validateVCAuthenticity: async (VCData: object): Promise<void> => {
    var verifiableCredential: VerifiableCredential = VCData as VerifiableCredential;

    await verifyVerifiableCredential(verifiableCredential);

    return;
  },

  validateVPAuthenticity: async (VPData: object): Promise<void> => {
    var verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    await Promise.all([
      verifyVerifiablePresentation(verifiablePresentation),
      ...(verifiablePresentation.verifiableCredential
        ? verifiablePresentation.verifiableCredential.map((vc) => verifyVerifiableCredential(vc))
        : []),
    ]);

    return;
  },
};

module.exports = mydidAuth;
export default mydidAuth;
