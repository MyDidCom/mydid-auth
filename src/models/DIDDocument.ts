export class DIDDocument {
  address: string;
  assertionKey: string;
  authenticationKey: string;

  constructor(
    address: string,
    assertionKey: string,
    authenticationKey: string
  ) {
    this.address = address;
    this.assertionKey = assertionKey;
    this.authenticationKey = authenticationKey;
  }
}
