import { validateDelegationSignerBinding } from '../../src/utils/verifications';
import { VerifiableCredential } from '../../src/models/VerifiableCredential';

const DELEGATE_DID = 'did:mydid:0x1111111111111111111111111111111111111111';
const OTHER_DID = 'did:mydid:0x2222222222222222222222222222222222222222';

function delegatedCredential(delegatedDid: string): VerifiableCredential {
  return ({
    issuer: {
      id: DELEGATE_DID,
      endorsement: {
        credentialSubject: {
          id: delegatedDid,
          endorsementComment: `DELEGATION::Badge::${'a'.repeat(64)}`,
        },
      },
    },
    proof: {
      verificationMethod: `${DELEGATE_DID}#ASSR_1`,
    },
  } as unknown) as VerifiableCredential;
}

test('accepts a badge signed by the DID named in its delegation', () => {
  expect(() =>
    validateDelegationSignerBinding(delegatedCredential(DELEGATE_DID))
  ).not.toThrow();
});

test('rejects a delegation attached to another badge signer', () => {
  expect(() =>
    validateDelegationSignerBinding(delegatedCredential(OTHER_DID))
  ).toThrow("Badge signer doesn't match delegated DID");
});
