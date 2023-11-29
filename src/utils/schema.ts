import Ajv from 'ajv';
import badgeDelegationSchema from '../res/badge_delegation.schema.json';
import badgeBasicSchema from '../res/badge_basic.schema.json';
import badgeCommunitySchema from '../res/badge_community.schema.json';
import badgeMembershipSchema from '../res/badge_membership.schema.json';
import badgeParticipationSchema from '../res/badge_participation.schema.json';
import badgeRoleSchema from '../res/badge_role.schema.json';
import certificateSchema from '../res/certificate.schema.json';
import verifiablePresentationSchema from '../res/verifiable_presentation.schema.json';

const ajv = new Ajv({ strict: false, allErrors: true });

function validateJsonAgainstSchema(schema: object, json: object): boolean {
  try {
    const validate = ajv.compile(schema);
    return validate(json);
  } catch (e) {
    console.log(e);
    return false;
  }
}

export function isVerifiablePresentationSchema(VPData: object) {
  return validateJsonAgainstSchema(verifiablePresentationSchema, VPData);
}

export function isVerifiableCredentialSchema(VCData: object) {
  return (
    validateJsonAgainstSchema(badgeDelegationSchema, VCData) ||
    validateJsonAgainstSchema(badgeBasicSchema, VCData) ||
    validateJsonAgainstSchema(badgeCommunitySchema, VCData) ||
    validateJsonAgainstSchema(badgeMembershipSchema, VCData) ||
    validateJsonAgainstSchema(badgeParticipationSchema, VCData) ||
    validateJsonAgainstSchema(badgeRoleSchema, VCData) ||
    validateJsonAgainstSchema(certificateSchema, VCData)
  );
}
