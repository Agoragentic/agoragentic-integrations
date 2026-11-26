import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const legacyPath = new URL('schema/transaction-assurance-envelope.v1.json', root);
const outputPath = new URL('schema/transaction-assurance-envelope.v2.json', root);
const LEGACY_SHA256 = '96d20f45daeaaa3bcfc9cb9b9df0762afd5bd73e3c2a8b988e0d9c68a093e982';
const ref = (name) => ({ $ref: `#/$defs/${name}` });
const closed = (properties, required = Object.keys(properties)) => ({
  type: 'object', additionalProperties: false, required, properties,
});
const nullable = (value) => ({ anyOf: [value, { type: 'null' }] });
const integer = { type: 'integer', minimum: 0 };
const counter = { type: 'integer', minimum: 0, maximum: 100 };
const falseValue = { const: false };
const falseFlags = (names) => closed(Object.fromEntries(names.map((name) => [name, falseValue])));
const list = (item, extra = {}) => ({ type: 'array', items: item, ...extra });

export function renderEnvelopeV2Schema(legacyBytes) {
  if (createHash('sha256').update(legacyBytes).digest('hex') !== LEGACY_SHA256) {
    throw new Error('Historical public v1 schema bytes changed; do not rewrite its contract.');
  }
  const schema = JSON.parse(legacyBytes.toString('utf8'));
  schema.$id = 'https://agoragentic.com/schemas/transaction-assurance-envelope.v2.json';
  schema.title = 'Agoragentic Transaction Assurance Library Envelope V2';
  schema.description = 'Versioned current-library record, including unverified privacy declarations and optional derived evidence. Shape validation grants no authority, verifies no signature, and proves no hosted acceptance or complete transaction.';
  schema.properties.schema.const = 'agoragentic.transaction-assurance-envelope.v2';
  const addFields = (section, fields) => {
    Object.assign(schema.properties[section].properties, fields);
    schema.properties[section].required.push(...Object.keys(fields));
  };
  addFields('principal', { identity_evidence_ref: ref('nullableRef') });
  addFields('agent', { identity_evidence_ref: ref('nullableRef') });
  addFields('authority', {
    principal_ref: ref('nullableRef'), agent_ref: ref('nullableRef'),
    verification_verifier_ref: ref('nullableRef'), verification_evidence_ref: ref('nullableRef'),
    verification_checked_at: ref('nullableDate'),
    verification_trust_mode: { enum: ['none', 'trusted_callback'] },
    verification_binding_hash: ref('nullableHash'),
    revocation_evidence_ref: ref('nullableRef'), revocation_checked_at: ref('nullableDate'),
  });
  schema.$defs.nullableMoney = nullable(ref('money'));
  addFields('payment', {
    daily_spend_before: ref('nullableMoney'), total_spend_before: ref('nullableMoney'),
    budget_usage_ref: ref('nullableRef'),
  });
  for (const flag of Object.keys(schema.properties.redaction.properties)) {
    schema.properties.redaction.properties[flag] = { type: 'boolean' };
  }
  addFields('redaction', { verification_status: { const: 'not_verified' } });
  schema.properties.redaction.description = 'Unverified declarations only. Current builder exclusions are false. A historical source may retain its declarations without becoming verified or public-safe.';
  schema.properties.evidence.properties.complete_chain_verified = falseValue;
  schema.properties.evidence.properties.envelope_hash = ref('sha256');
  schema.properties.evidence.properties.profile_source = closed({
    schema: { const: 'agoragentic.transaction-assurance-envelope.v1' },
    envelope_hash: ref('sha256'), envelope_id: ref('ref'),
  });

  const summaryNonClaims = ['output_correctness_proven', 'task_fulfillment_proven',
    'seller_identity_proven', 'payment_settlement_proven', 'delivery_proven',
    'complete_transaction_verified', 'certification', 'trust_endorsement'];
  schema.$defs.evaluationSummary = closed({
    schema: { const: 'agoragentic.transaction-evaluation-summary.v1' },
    status: { enum: ['unknown', 'failed', 'review', 'passed'] },
    evidence_count: integer, evaluator_count: integer, deterministic_evaluator_count: integer,
    failed_evaluator_ids: list(ref('ref')), review_evaluator_ids: list(ref('ref')),
    mean_score: { type: ['number', 'null'], minimum: 0, maximum: 1 },
    complete_transaction_verified: falseValue, certification: falseValue, authority_granted: falseValue,
  });
  schema.$defs.toplocSummary = closed({
    schema: { const: 'agoragentic.toploc-inference-attestation-summary.v1' },
    status: { enum: ['rejected', 'review'] },
    declared_validation_result: { enum: ['accepted', 'rejected', 'review'] },
    attestation_count: counter, declared_accept_count: counter,
    declared_reject_count: counter, declared_review_count: counter,
    scope: { const: 'model_configuration_execution' },
    ...Object.fromEntries(['verification_status', 'provenance_verification_status',
      'source_exactness_verification_status', 'privacy_verification_status',
      'public_safe_verification_status'].map((name) => [name, { const: 'not_verified' }])),
    trusted_proof: falseValue,
    ...Object.fromEntries(summaryNonClaims.map((name) => [name, falseValue])),
    authority_granted: falseValue,
  });
  schema.$defs.actionReference = closed({
    profile: { const: 'mycelium-action-ref-v1.0' },
    value: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    preimage_ref: ref('nullableHash'), recomputation: { enum: ['not_checked', 'match', 'mismatch'] },
    source_revision: { const: '2935c328177dca9f042fa1b910f5237ffe71da9e' },
  });
  schema.$defs.decimalUint = { type: 'string', pattern: '^(0|[1-9]\\d*)$' };
  schema.$defs.hex32 = { type: 'string', pattern: '^0x[a-f0-9]{64}$' };
  const checkNames = ['chain_id', 'registry_address', 'runtime_code_hash', 'transaction_hash',
    'receipt_success', 'target_contract', 'call_selector', 'calldata_reference', 'block_number',
    'event_present', 'event_address', 'event_topic', 'event_reference', 'log_index',
    'event_block_number', 'event_block_hash', 'event_transaction_hash', 'event_not_removed',
    'event_timestamp', 'finality'];
  const checks = closed(Object.fromEntries(checkNames.map((name) => [name, { type: 'boolean' }])));
  const noExternalAuthority = falseFlags(['evidence_grants_authority', 'can_spend', 'can_execute',
    'can_fund_wallet', 'can_publish', 'can_deploy', 'can_change_trust']);
  schema.$defs.externalVerification = closed({
    schema: { const: 'agoragentic.external-verification.v1' },
    profile: { const: 'mycelium-anchor-registry-v1' },
    source_revision: { const: 'cd8100e63d17882ba11843882acaf5b1e069fdce' },
    status: { enum: ['not_checked', 'checked_match', 'checked_mismatch'] },
    action_reference_profile: { const: 'mycelium-action-ref-v1.0' },
    action_reference: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    checks: { anyOf: [closed({}), checks] },
    failed_checks: list({ enum: checkNames }, { uniqueItems: true, maxItems: checkNames.length }),
    proves: { enum: [[], ['reference_anchored', 'public_block_timestamp', 'event_inclusion']] },
    does_not_prove: { const: ['principal_authority', 'execution_correctness', 'delivery', 'settlement', 'single_execution'] },
    chain_id: { enum: [null, 'eip155:8453', 'eip155:42161', 'eip155:57073'] },
    registry_ref: { enum: [null, 'evm:0x49feca52bc634a9ab773226d16619dec547794aa'] },
    transaction_ref: nullable({ type: 'string', pattern: '^evm-tx:0x[a-f0-9]{64}$' }),
    block_number: nullable(ref('decimalUint')), block_hash: nullable(ref('hex32')),
    block_timestamp: nullable(ref('decimalUint')),
    log_index: nullable({ type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
    confirmations: nullable(ref('decimalUint')),
    minimum_confirmations: { type: 'integer', minimum: 12, maximum: Number.MAX_SAFE_INTEGER },
    observed_matching_event_count: { type: 'integer', minimum: 0, maximum: 32 },
    verifier_ref: ref('nullableRef'), evidence_ref: ref('nullableRef'), checked_at: ref('nullableDate'),
    raw_rpc_payload_embedded: falseValue, complete_chain_verified: falseValue,
    authority_flags: noExternalAuthority,
    assurance_binding: closed({
      envelope_id: ref('ref'), prior_envelope_hash: ref('sha256'), binding_hash: ref('sha256'),
    }),
  });
  schema.$defs.externalVerification.allOf = [{
    if: { properties: { status: { const: 'not_checked' } }, required: ['status'] },
    then: { properties: { checks: closed({}) } },
    else: { properties: { checks } },
  }];
  Object.assign(schema.properties, {
    authenticated_action_ref: {
      ...ref('nullableRef'),
      description: 'Opaque existing caller reference; carrying it does not authenticate an action or grant authority.',
    },
    evaluation_evidence: list({ $ref: 'https://agoragentic.com/schemas/transaction-evaluation-evidence.v1.json' }, { minItems: 1 }),
    evaluation_summary: ref('evaluationSummary'),
    inference_attestations: list({ $ref: 'https://agoragentic.com/schemas/toploc-inference-attestation.v1.json' }, { minItems: 1, maxItems: 100 }),
    inference_attestation_summary: ref('toplocSummary'),
    external_action_refs: list(ref('actionReference'), { minItems: 1, uniqueItems: true }),
    external_verification: ref('externalVerification'),
  });
  schema.dependentRequired = {};
  for (const [entries, summary] of [['evaluation_evidence', 'evaluation_summary'],
    ['inference_attestations', 'inference_attestation_summary'], ['external_action_refs', 'external_verification']]) {
    schema.dependentRequired[entries] = [summary];
    schema.dependentRequired[summary] = [entries];
  }
  return `${JSON.stringify(schema, null, 2)}\n`;
}

function main() {
  const generated = renderEnvelopeV2Schema(fs.readFileSync(legacyPath));
  if (process.argv.includes('--write')) {
    fs.writeFileSync(outputPath, generated);
    console.log('Wrote current-library v2 schema; historical v1 unchanged.');
  } else if (fs.readFileSync(outputPath, 'utf8') !== generated) {
    throw new Error('Envelope v2 schema is stale; run scripts/generate-envelope-schema.mjs --write.');
  } else console.log('Envelope v2 schema matches its owning generator.');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
