import { recoverAddress } from "../../src/utils/cryptography";

test("Verify specific hash", async () => {
  const document =
    '{"context":["https://www.w3.org/2018/credentials/v1","https://www.w3.org/2018/credentials/examples/v1"],"type":["VerifiableCredential"],"issuer":"did:SDI:0xcba95456587CD7E6f5Da9b321C635150300566be","issuanceDate":"2021-06-17T15:11:50Z","credentialSubject":{"id":"did:SDI:0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db","type":"Person","givenName":"Fred","familyName":"Martin"}}';
  const signature =
    "1bde8ef742a0f34ddb291935d3f9df28a2a7258ecd1ab14b8bac67d6b96d4bc2407caf18226895786392d42a22aacac2627be7a6120eb9812bbd19fa8440b06a2d";
  const publicKey = recoverAddress(signature, document);
  expect(publicKey).toEqual("0xcba95456587CD7E6f5Da9b321C635150300566be");
});
