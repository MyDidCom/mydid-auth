export class DIDDocument {
  address: string;
  assertionKey: string;
  authenticationKey: string;

  constructor(
    address: string,
    assertionKey: string,
    authenticationKey: string
  ) {
    this.address = address.toLowerCase();
    this.assertionKey = assertionKey.toLowerCase();
    this.authenticationKey = authenticationKey.toLowerCase();
  }
}
