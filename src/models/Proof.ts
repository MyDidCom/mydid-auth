export interface Proof {
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
