import { Web3Provider } from './web3Provider';
import { VerifiablePresentationRequest } from './models/VerifiablePresentationRequest';
import { VerifiablePresentation } from './models/VerifiablePresentation';
import { VerifiableCredential } from './models/VerifiableCredential';
import { Issuer } from './models/VerifiableCredential';
import { isVerifiablePresentationSchema, isVerifiableCredentialSchema } from './utils/schema';
import { verifyVerifiablePresentation, verifyVerifiableCredential } from './utils/verifications';
import { didToAddress } from './utils/cryptography';

let authorizeVpSignedByIssuer = false;

const mydidAuth = {
  initialize: (config: object): void => {
    Web3Provider.getInstance().initialize(
      config['web3GivenProvider'],
      config['smartContractAddress']
    );
    authorizeVpSignedByIssuer = config['authorizeVpSignedByIssuer'];
  },

  createVPRequest: (challenge: string, domain: string, verifiableCredentials: string[]) => {
    return new VerifiablePresentationRequest(challenge, domain, verifiableCredentials);
  },

  validateVCConsistency: (VCData: object): void => {
    var verifiableCredential: VerifiableCredential = VCData as VerifiableCredential;
    recursiveSchemaVerify(verifiableCredential);
    return;
  },

  validateVPConsistency: (VPData: object): void => {
    if (!isVerifiablePresentationSchema(VPData)) throw 'Incorrect format for verifiable presentation';

    const verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    if (verifiablePresentation.verifiableCredential) {
      for (const verifiableCredential of verifiablePresentation.verifiableCredential) {
        // check VP signer is corresponding to VC owner (or VC signer for issuer specific case)
        if (
          didToAddress(verifiablePresentation.proof.verificationMethod.split('#')[0]) !=
          didToAddress(verifiableCredential.credentialSubject.id)
        ) {
          if (!authorizeVpSignedByIssuer) throw `Incorrect signer for verifiable presentation`;
          else if (
            didToAddress(verifiablePresentation.proof.verificationMethod.split('#')[0]) !=
            didToAddress(verifiableCredential.proof.verificationMethod.split('#')[0])
          )
            throw `Incorrect signer for verifiable presentation`;
        }

        // check VC format
        recursiveSchemaVerify(verifiableCredential);
      }
    }

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

function recursiveSchemaVerify(verifiableCredential: VerifiableCredential): void {
  if (!isVerifiableCredentialSchema(verifiableCredential)) throw 'Incorrect format for verifiable credential';

  if ((verifiableCredential.issuer as Issuer).endorsement) {
    recursiveSchemaVerify((verifiableCredential.issuer as Issuer).endorsement);
  }
}
