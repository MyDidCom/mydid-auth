import { Web3Provider } from './web3Provider';
import { VerifiablePresentationRequest } from './models/VerifiablePresentationRequest';
import { VerifiablePresentation } from './models/VerifiablePresentation';
import { isVerifiablePresentationSchema } from './utils/schema';
import { verifyVerifiablePresentation, verifyVerifiableCredential } from './utils/verifications';

const mydidAuth = {
  initialize: (config: object): void => {
    Web3Provider.getInstance().initialize(config['web3GivenProvider'], config['smartContractAddress']);
  },

  createVPRequest: (challenge: string, domain: string, verifiableCredentials: string[]) => {
    return new VerifiablePresentationRequest(challenge, domain, verifiableCredentials);
  },

  validateVPConsistency: (VPData: object): object => {
    if (!isVerifiablePresentationSchema(VPData)) throw 'Incorrect format for verifiable presentation';

    const verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    let vpSignerIsSender = true;
    let vpSignerIsReceiver = true;

    if (verifiablePresentation.verifiableCredential) {
      for (const verifiableCredential of verifiablePresentation.verifiableCredential) {
        if (verifiableCredential.credentialSubject.id != verifiablePresentation.id) vpSignerIsReceiver = false;
        if (
          verifiableCredential.proof.verificationMethod.split('#')[0] !=
          verifiablePresentation.proof.verificationMethod.split('#')[0]
        )
          vpSignerIsSender = false;
      }
    }

    if (!vpSignerIsReceiver && !vpSignerIsSender) throw `Incorrect signer for verifiable presentation`;

    return {
      status: 'validated',
      vpSignerIsReceiver,
      vpSignerIsSender,
    };
  },

  validateVPAuthenticity: async (VPData: object): Promise<object> => {
    var verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    await Promise.all([
      verifyVerifiablePresentation(verifiablePresentation),
      ...(verifiablePresentation.verifiableCredential
        ? verifiablePresentation.verifiableCredential.map((vc) => verifyVerifiableCredential(vc))
        : []),
    ]);

    return {
      status: 'validated',
    };
  },
};

module.exports = mydidAuth;
export default mydidAuth;
