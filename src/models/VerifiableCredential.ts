import { CredentialSubject } from "./CredentialSubject";
import { Proof } from "./Proof";

export interface VerifiableCredential {
    context: string[];
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: CredentialSubject;
    proof: Proof;
}
