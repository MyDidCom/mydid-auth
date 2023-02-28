export interface VerifiableCredential {
  context: string[];
  type: string[];
  issuer: string | Issuer;
  issuanceDate: string;
  templateHash?: string;
  credentialSubject: CredentialSubject;
  proof: Proof;
}

export interface Issuer {
  id: string;
  type: string;
  endorsement?: VerifiableCredential;
}

interface CredentialSubject {
  id: string;
  type: string;
  endorsementComment?: string;
  achievement?: Achievement;
}

interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  signatureValue?: string;
  proofValue?: string;
  challenge?: string;
  domain?: string;
  eip712?: {
    messageDataEip712Schema: string;
    primaryType: string;
    domain: {
      name: string;
      chainId: number;
      version: string;
    };
  };
}

interface Achievement {
  id: string;
  type: string;
  description: string;
  name: string;
  criteria: Criteria;
}

interface Criteria {
  id: string;
  narrative: string;
}
