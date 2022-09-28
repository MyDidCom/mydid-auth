import mydidAuth from "../src";

import verifiablePresentation from "./res/verifiablePresentation.json";
import verifiablePresentationWithoutVCs from "./res/verifiablePresentationWithoutVCs.json";
import verifiablePresentationWrongKey from "./res/verifiablePresentationWrongKey.json";
import verifiablePresentationWrongSignature from "./res/verifiablePresentationWrongSignature.json";
import verifiablePresentationWrongVCId from "./res/verifiablePresentationWrongVCId.json";
import verifiablePresentationWrongVCSignature from "./res/verifiablePresentationWrongVCSignature.json";

// Testing web3 provider initialization
test("Test incorrect web3 provider initialization", async () => {
  expect.assertions(1);
  try {
    mydidAuth.initialize({
      web3GivenProvider:
        "https://data-seed-prebsc-1-s1.binance.org:8545",
      smartContractAddress: "0x6828adf1aED03be429eE42053a4F72CDd3c706",
    });
  } catch {
    expect(true).toBeTruthy();
  }
});
test("Test correct web3 provider initialization", async () => {
  expect.assertions(1);
  try {
    mydidAuth.initialize({
      web3GivenProvider:
        "https://data-seed-prebsc-1-s1.binance.org:8545",
      smartContractAddress: "0x6828adf1aED03be429eE42053a4F72CDd3c70846",
    });
    expect(true).toBeTruthy();
  } catch {}
});

// Testing VP request creation
test("Test VP request creation", async () => {
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
  var validation = false;
  try {
    validation = mydidAuth.validateVPConsistency(verifiablePresentation);
  } catch {}
  expect(validation).toBeTruthy();
});
test("Test authenticity for correct VP with VCs", async () => {
  var validation = false;
  try {
    validation = await mydidAuth.validateVPAuthenticity(verifiablePresentation);
  } catch {}
  expect(validation).toBeTruthy();
});

// Testing correct VP without VCs
test("Test consistency for correct VP without VCs", async () => {
  var validation = false;
  try {
    validation = mydidAuth.validateVPConsistency(verifiablePresentationWithoutVCs);
  } catch {}
  expect(validation).toBeTruthy();
});
test("Test authenticity for correct VP without VCs", async () => {
  var validation = false;
  try {
    validation = await mydidAuth.validateVPAuthenticity(verifiablePresentationWithoutVCs);
  } catch {}
  expect(validation).toBeTruthy();
});

// Testing correct VPs
test("Test consistency for VP with wrong key", async () => {
  var validation = false;
  try {
    validation = mydidAuth.validateVPConsistency(verifiablePresentationWrongKey);
  } catch {}
  expect(validation).toBeFalsy();
});
test("Test consistency for VP with wrong VC id", async () => {
  var validation = false;
  try {
    validation = mydidAuth.validateVPConsistency(verifiablePresentationWrongVCId);
  } catch {}
  expect(validation).toBeFalsy();
});
test("Test authenticity for VP with wrong signature", async () => {
  var validation = false;
  try {
    validation = await mydidAuth.validateVPAuthenticity(verifiablePresentationWrongSignature);
  } catch {}
  expect(validation).toBeFalsy();
});
test("Test authenticity for VP with wrong VC signature", async () => {
  var validation = false;
  try {
    validation = await mydidAuth.validateVPAuthenticity(verifiablePresentationWrongVCSignature);
  } catch {}
  expect(validation).toBeFalsy();
});
