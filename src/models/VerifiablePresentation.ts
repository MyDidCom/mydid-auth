import { VerifiableCredential } from "./VerifiableCredential";
import { Proof } from "./Proof";

export interface VerifiablePresentation {
  context: string[];
  type: string[];
  id: string;
  verifiableCredential?: VerifiableCredential[];
  proof: Proof;
}
