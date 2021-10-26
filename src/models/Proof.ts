export interface Proof {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    signatureValue: string;
    challenge?: string;
    domain?: string;
}


