import { Web3Provider } from "./web3Provider";
import { VerifiablePresentationRequest } from "./models/VerifiablePresentationRequest";
import { VerifiablePresentation } from "./models/VerifiablePresentation";
import { isVerifiablePresentationSchema } from "./utils/schema";
import { checkVPSignature, checkVCSignature, checkVCIssuer } from "./utils/verifications";

const mydidAuth = {
  initialize: (config: object): void => {
    Web3Provider.getInstance().initialize(config["web3GivenProvider"], config["smartContractAddress"]);
  },

  createVPRequest: (challenge: string, domain: string, verifiableCredentials: string[]) => {
    return new VerifiablePresentationRequest(challenge, domain, verifiableCredentials);
  },

  validateVPConsistency: (VPData: object) => {
    if (!isVerifiablePresentationSchema(VPData))
      return {
        validated: false,
        error: "Incorrect format for verifiable presentation",
      };

    const verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    if (verifiablePresentation.verifiableCredential) {
      for (const verifiableCredential of verifiablePresentation.verifiableCredential) {
        if (verifiableCredential.credentialSubject.id.toLowerCase() != verifiablePresentation.id.toLowerCase())
          return {
            validated: false,
            error: "Incorrect id in credential subjects",
          };
      }
    }

    return {
      validated: true,
    };
  },

  validateVPAuthenticity: async (VPData: object) => {
    var verifiablePresentation: VerifiablePresentation = VPData as VerifiablePresentation;

    if (verifiablePresentation.verifiableCredential) {
      for (const verifiableCredential of verifiablePresentation.verifiableCredential) {
        if (!(await checkVCSignature(verifiableCredential)))
          return {
            validated: false,
            error: "Incorrect VC signature",
          };
        if (!(await checkVCIssuer(verifiableCredential)))
          return {
            validated: false,
            error: "Incorrect VC issuer",
          };
      }
    }

    if (!(await checkVPSignature(verifiablePresentation)))
      return {
        validated: false,
        error: "Incorrect VP signature",
      };

    return {
      validated: true,
    };
  },
};

module.exports = mydidAuth;
export default mydidAuth;