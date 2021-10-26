import mydidAuth from "../src";

import verifiablePresentation from "./res/verifiablePresentation.json";
import verifiablePresentationWithoutVCs from "./res/verifiablePresentationWithoutVCs.json";
import verifiablePresentationWrongKey from "./res/verifiablePresentationWrongKey.json";
import verifiablePresentationWrongSignature from "./res/verifiablePresentationWrongSignature.json";
import verifiablePresentationWrongVCId from "./res/verifiablePresentationWrongVCId.json";
import verifiablePresentationWrongVCSignature from "./res/verifiablePresentationWrongVCSignature.json";

test("Initialize Web3 provider", async () => {
  expect.assertions(1);
  try {
    await mydidAuth.initialize({
      web3GivenProvider:
        "https://apis-sj.ankr.com/9ff20ecf96c54def988f8c0aea57becf/fa4fde1a75da28a4bbc27c03d6b7589d/binance/full/test",
      smartContractAddress: "0x6828adf1aED03be429eE42053a4F72CDd3c70846",
    });
    expect(true).toBeTruthy();
  } catch {
    // should not come here
  }
});

// Testing VC creation
test("Test consistency for correct VP with VCs", async () => {
  const result = mydidAuth.createVPRequest(
    "6360c6acfe7951946f0532dcee1d314645312a4b5480d80646ff9241ce68892d",
    "https://mywebiste.com/api/v1/callback",
    ["email", "nationality"]
  );
  expect(result).toEqual({
    challenge: "6360c6acfe7951946f0532dcee1d314645312a4b5480d80646ff9241ce68892d",
    domain: "https://mywebiste.com/api/v1/callback",
    query: [
      {
        type: "DIDAuth",
      },
    ],
    verifiableCredentials: ["email", "nationality"],
  });
});

// Testing correct VP with VCs
test("Test consistency for correct VP with VCs", async () => {
  const result = mydidAuth.validateVPConsistency(verifiablePresentation);
  expect(result.validated).toBeTruthy();
});
test("Test authenticity for correct VP with VCs", async () => {
  const result = await mydidAuth.validateVPAuthenticity(verifiablePresentation);
  expect(result.validated).toBeTruthy();
});

// Testing correct VP without VCs
test("Test consistency for correct VP with VCs", async () => {
  const result = mydidAuth.validateVPConsistency(verifiablePresentationWithoutVCs);
  expect(result.validated).toBeTruthy();
});
test("Test authenticity for correct VP with VCs", async () => {
  const result = await mydidAuth.validateVPAuthenticity(verifiablePresentationWithoutVCs);
  expect(result.validated).toBeTruthy();
});

// Testing correct VPs
test("Test consistency for VP with wrong key", async () => {
  const result = mydidAuth.validateVPConsistency(verifiablePresentationWrongKey);
  expect(result.validated).toBeFalsy();
});
test("Test consistency for VP with wrong VC id", async () => {
  const result = mydidAuth.validateVPConsistency(verifiablePresentationWrongVCId);
  expect(result.validated).toBeFalsy();
});
test("Test authenticity for VP with wrong signature", async () => {
  const result = await mydidAuth.validateVPAuthenticity(verifiablePresentationWrongSignature);
  expect(result.validated).toBeFalsy();
});
test("Test authenticity for VP with wrong VC signature", async () => {
  const result = await mydidAuth.validateVPAuthenticity(verifiablePresentationWrongVCSignature);
  expect(result.validated).toBeFalsy();
});
