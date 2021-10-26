import { isIssuerForAddress, getDIDDocumentForAddress } from "../../src/utils/contract";

test("Get contract owner address", async () => {
  const isIssuer = await isIssuerForAddress('0xcba95456587cd7e6f5da9b321c635150300566be');
  expect(isIssuer).toEqual(true);
});

test("Get DID document for address", async () => {
  const liteDidDocument = await getDIDDocumentForAddress("0xcba95456587cd7e6f5da9b321c635150300566be");
  // check address
  expect(liteDidDocument.address).toEqual("0xcba95456587cd7e6f5da9b321c635150300566be");
  // check assertion key
  expect(liteDidDocument.assertionKey).toEqual("0x01b74f964df35920cb8a45f281b97d95dd5a97a13b7932b02f77e1511dc21f37");
  // check authentication key
  expect(liteDidDocument.authenticationKey).toEqual("0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71");
});
