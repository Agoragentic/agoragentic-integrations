import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const LEGACY_ENVELOPE_SCHEMA = 'agoragentic.transaction-assurance-envelope.v1';
export const ENVELOPE_SCHEMA = 'agoragentic.transaction-assurance-envelope.v2';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const name of ['transaction-evaluation-evidence.v1', 'toploc-inference-attestation.v1']) {
  ajv.addSchema(JSON.parse(fs.readFileSync(new URL(`../schema/${name}.json`, import.meta.url), 'utf8')));
}
const validateV2 = ajv.compile(JSON.parse(fs.readFileSync(
  new URL('../schema/transaction-assurance-envelope.v2.json', import.meta.url), 'utf8',
)));

export function isSupportedEnvelopeSchema(value) {
  return value === LEGACY_ENVELOPE_SCHEMA || value === ENVELOPE_SCHEMA;
}

export function assertEnvelopeV2Shape(envelope) {
  if (!validateV2(envelope)) {
    throw new TypeError(`Envelope v2 shape is invalid: ${ajv.errorsText(validateV2.errors)}`);
  }
  return envelope;
}

export function isEnvelopeV2Shape(envelope) {
  return validateV2(envelope);
}

function addMissingFields(object, fields, section) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) {
    throw new TypeError(`envelope.${section} must be an object`);
  }
  for (const [field, value] of Object.entries(fields)) {
    if (!Object.hasOwn(object, field)) object[field] = value;
  }
}

// Internal attachment helper. Callers verify the source envelope hash first.
// This clone deliberately acquires no process-local trusted-verifier binding.
export function promoteEnvelopeClone(envelope) {
  if (!isSupportedEnvelopeSchema(envelope?.schema)) {
    throw new TypeError('envelope must use a supported transaction-assurance envelope schema');
  }
  const result = structuredClone(envelope);
  if (envelope.schema === LEGACY_ENVELOPE_SCHEMA) {
    if (!result.evidence || Object.hasOwn(result.evidence, 'profile_source')) {
      throw new TypeError('legacy envelope must have evidence without a profile_source claim');
    }
    result.evidence.profile_source = {
      schema: LEGACY_ENVELOPE_SCHEMA,
      envelope_hash: envelope.evidence.envelope_hash,
      envelope_id: envelope.envelope_id,
    };
    addMissingFields(result.principal, { identity_evidence_ref: null }, 'principal');
    addMissingFields(result.agent, { identity_evidence_ref: null }, 'agent');
    addMissingFields(result.authority, {
      principal_ref: null, agent_ref: null,
      verification_verifier_ref: null, verification_evidence_ref: null,
      verification_checked_at: null, verification_trust_mode: 'none',
      verification_binding_hash: null, revocation_evidence_ref: null,
      revocation_checked_at: null,
    }, 'authority');
    addMissingFields(result.payment, {
      daily_spend_before: null, total_spend_before: null, budget_usage_ref: null,
    }, 'payment');
    addMissingFields(result.redaction, { verification_status: 'not_verified' }, 'redaction');
  }
  result.schema = ENVELOPE_SCHEMA;
  return result;
}
