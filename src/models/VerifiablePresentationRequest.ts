export class VerifiablePresentationRequest {
  query: object[];
  challenge: string;
  domain: string;
  verifiableCredentials: string[];

  constructor(challenge: string, domain: string, verifiableCredentials: string[]) {
    this.query = [{ type: "DIDAuth" }];
    this.challenge = challenge;
    this.domain = domain;
    this.verifiableCredentials = verifiableCredentials;
  }
}
