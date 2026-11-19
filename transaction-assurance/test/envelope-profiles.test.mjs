import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  ENVELOPE_SCHEMA, LEGACY_ENVELOPE_SCHEMA, buildTransactionAssuranceEnvelope,
  computeEnvelopeHash, evaluateTransactionAssuranceEnvelope, normalizeAuthorityArtifact,
  bindExternalVerification, normalizeExternalActionReference, sha256Ref,
} from '../src/index.mjs';
import { assertEnvelopeV2Shape } from '../src/envelope-profiles.mjs';
import { attachEvaluationEvidence } from '../src/evaluation-evidence.mjs';
import { attachToplocEvidence } from '../src/toploc-evidence.mjs';
import { bindTrustedEnvelope, trustedEnvelopeBinding } from '../src/trusted-verifier-boundary.mjs';
import { renderEnvelopeV2Schema } from '../scripts/generate-envelope-schema.mjs';

const TIME = '2026-08-06T00:01:00.000Z';
const newFields = ['principal.identity_evidence_ref', 'agent.identity_evidence_ref',
  'authority.principal_ref', 'authority.agent_ref', 'authority.verification_verifier_ref',
  'authority.verification_evidence_ref', 'authority.verification_checked_at',
  'authority.verification_trust_mode', 'authority.verification_binding_hash',
  'authority.revocation_evidence_ref', 'authority.revocation_checked_at',
  'payment.daily_spend_before', 'payment.total_spend_before', 'payment.budget_usage_ref',
  'redaction.verification_status'];
const legacyBytes = fs.readFileSync(new URL('../schema/transaction-assurance-envelope.v1.json', import.meta.url));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateV1 = ajv.compile(JSON.parse(legacyBytes));

function envelope() {
  return buildTransactionAssuranceEnvelope({
    createdAt: TIME, now: TIME,
    principalIdentityVerification: 'verified', principalIdentityEvidenceRef: 'identity:principal',
    agentIdentityVerification: 'verified', agentIdentityEvidenceRef: 'identity:agent',
    normalizedAuthority: normalizeAuthorityArtifact({
      owner_id: 'owner:fixture', buyer_agent_id: 'agent:fixture',
      expires_at: '2026-08-07T00:00:00Z', audience: 'agent:fixture', merchant_binding: 'seller:fixture',
      scope: { allowed_actions: ['execute:fixture'], allowed_sellers: ['seller:fixture'],
        allowed_categories: ['fixture'], allowed_payment_rails: ['x402'] },
      budget: { currency: 'USDC', max_per_action: '0.10', max_daily: '1.00', max_total: '5.00' },
    }, {
      verification: { status: 'verified', verifierRef: 'verifier:fixture', evidenceRef: 'evidence:fixture', checkedAt: TIME },
      revocation: { status: 'active', evidenceRef: 'revocation:fixture', checkedAt: TIME },
    }),
    commercialIntent: { action: 'execute:fixture', taskRef: 'task:fixture', sellerRef: 'seller:fixture',
      capabilityRef: 'capability:fixture', category: 'fixture', currency: 'USDC', quotedAmount: '0.05',
      quoteRef: 'quote:fixture', quoteHash: sha256Ref('quote'), termsRef: 'terms:fixture',
      termsHash: sha256Ref('terms'), termsMatchStatus: 'match' },
    payment: { paymentIdentifier: 'payment:fixture', rail: 'x402', amount: '0.05', currency: 'USDC',
      dailySpendBefore: '0', totalSpendBefore: '0', budgetUsageRef: 'budget:fixture' },
    execution: { idempotencyKeyHash: sha256Ref('idempotency'), inputHash: sha256Ref('input') },
  });
}

function evaluationEntry() {
  return {
    environment_id: 'fixture', environment_version: '1', environment_hash: sha256Ref('environment'),
    task_id: 'fixture', harness: { id: 'fixture', version: '1' }, trace_hash: sha256Ref('trace'), observed_at: TIME,
    evaluators: [{ id: 'fixture', version: '1', type: 'deterministic', result: 'pass',
      rubric_hash: sha256Ref('rubric'), evidence_refs: ['evidence:fixture'] }],
  };
}

function toplocEntry() {
  return { scheme_version: 'fixture-v1', model_ref: 'model:fixture', configuration_hash: sha256Ref('configuration'),
    proof_ref: 'proof:fixture', proof_hash: sha256Ref('proof'), validator_ref: 'validator:fixture',
    validator_version: '1', status: 'pending', evidence_refs: [] };
}

function actionReference() {
  return normalizeExternalActionReference({ profile: 'mycelium-action-ref-v1.0', value: 'a'.repeat(64) });
}

function legacyEnvelope() {
  const value = envelope();
  value.schema = LEGACY_ENVELOPE_SCHEMA;
  for (const path of newFields) {
    const [section, field] = path.split('.');
    delete value[section][field];
  }
  for (const flag of Object.keys(value.redaction)) value.redaction[flag] = true;
  value.evidence.envelope_hash = computeEnvelopeHash(value);
  assert.equal(validateV1(value), true, JSON.stringify(validateV1.errors));
  return value;
}

test('the immutable public v1 schema and example remain separate from generated v2', () => {
  assert.equal(createHash('sha256').update(legacyBytes).digest('hex'),
    '96d20f45daeaaa3bcfc9cb9b9df0762afd5bd73e3c2a8b988e0d9c68a093e982');
  const historical = fs.readFileSync(new URL('./fixtures/envelope-public-v1.example.json', import.meta.url));
  assert.equal(createHash('sha256').update(historical).digest('hex'),
    '2429e1ed7d5aa9d9428b0c3b35276dd66738bf09ff76bd8ed8d3a2b52be6e3a5');
  assert.equal(validateV1(JSON.parse(historical)), true, JSON.stringify(validateV1.errors));
  assert.equal(renderEnvelopeV2Schema(legacyBytes), fs.readFileSync(
    new URL('../schema/transaction-assurance-envelope.v2.json', import.meta.url), 'utf8'));
  assert.throws(() => renderEnvelopeV2Schema(Buffer.from('{}')), /Historical public v1 schema bytes changed/);
});

test('current builder emits closed v2 and preserves deterministic pre-execution behavior', () => {
  const value = envelope();
  assert.equal(value.schema, ENVELOPE_SCHEMA);
  assertEnvelopeV2Shape(value);
  assert.equal(validateV1(value), false);
  assert.equal(value.evidence.envelope_hash, computeEnvelopeHash(value));
  const result = evaluateTransactionAssuranceEnvelope(value, { now: TIME });
  assert.equal(result.decision, 'allow');
  assert.equal(result.complete_chain_verified, false);
  assert.ok(Object.values(result.authority_flags).every((flag) => flag === false));
});

test('package schema subpaths resolve to the shipped profile files', () => {
  const require = createRequire(import.meta.url);
  for (const version of ['v1', 'v2']) {
    const name = `transaction-assurance-envelope.${version}.json`;
    const exported = require.resolve(`@agoragentic/transaction-assurance/schema/${name}`);
    assert.deepEqual(JSON.parse(fs.readFileSync(exported, 'utf8')),
      JSON.parse(fs.readFileSync(new URL(`../schema/${name}`, import.meta.url), 'utf8')));
  }
});

test('all three attachment families compose as v2 without changing the input', () => {
  const original = envelope();
  const before = JSON.stringify(original);
  const evaluated = attachEvaluationEvidence(original, evaluationEntry());
  const attested = attachToplocEvidence(evaluated, toplocEntry(), { updatedAt: TIME });
  const bound = bindExternalVerification(attested, null, { actionReference: actionReference() });
  for (const value of [evaluated, attested, bound]) {
    assert.equal(value.schema, ENVELOPE_SCHEMA);
    assertEnvelopeV2Shape(value);
    assert.equal(value.evidence.envelope_hash, computeEnvelopeHash(value));
    assert.equal(value.evidence.complete_chain_verified, false);
  }
  assert.equal(JSON.stringify(original), before);
  assert.equal(bound.external_verification.assurance_binding.prior_envelope_hash, attested.evidence.envelope_hash);
  assert.equal(bound.evaluation_summary.authority_granted, false);
  assert.equal(bound.inference_attestation_summary.trusted_proof, false);
});

test('legacy attachment creates a new record with conservative defaults and source-hash continuity', () => {
  const original = legacyEnvelope();
  const before = JSON.stringify(original);
  const priorHash = original.evidence.envelope_hash;
  for (const extend of [
    (value) => attachEvaluationEvidence(value, evaluationEntry()),
    (value) => attachToplocEvidence(value, toplocEntry(), { updatedAt: TIME }),
    (value) => bindExternalVerification(value, null, { actionReference: actionReference() }),
  ]) {
    const result = extend(original);
    assertEnvelopeV2Shape(result);
    assert.deepEqual(result.evidence.profile_source, {
      schema: LEGACY_ENVELOPE_SCHEMA, envelope_hash: priorHash, envelope_id: original.envelope_id,
    });
    assert.equal(result.principal.identity_evidence_ref, null);
    assert.equal(result.authority.principal_ref, null);
    assert.equal(result.authority.verification_trust_mode, 'none');
    assert.equal(result.redaction.verification_status, 'not_verified');
    assert.equal(result.redaction.secrets_excluded, true);
    assert.equal(result.evidence.complete_chain_verified, false);
    assert.equal(evaluateTransactionAssuranceEnvelope(result, { now: TIME }).decision, 'deny');
    assert.equal(JSON.stringify(original), before);
  }
  assert.equal(evaluateTransactionAssuranceEnvelope(original, { now: TIME }).decision, 'deny');
});

test('partial attachment groups and unsupported fields cannot pass v2 evaluation', () => {
  for (const extras of [{ evaluation_summary: {} }, { evaluation_evidence: [] },
    { inference_attestation_summary: {} }, { inference_attestations: [] },
    { external_verification: {} }, { external_action_refs: [] }, { unknown_extension: true }]) {
    const value = Object.assign(envelope(), extras);
    value.evidence.envelope_hash = computeEnvelopeHash(value);
    assert.throws(() => assertEnvelopeV2Shape(value), /shape is invalid/);
    const result = evaluateTransactionAssuranceEnvelope(value, { now: TIME });
    assert.equal(result.decision, 'deny');
    assert.ok(result.blockers.includes('envelope_schema_invalid'));
    assert.equal(result.blockers.includes('envelope_hash_mismatch'), false);
  }
});

test('attachment producers refuse malformed records even when their source hash matches', () => {
  for (const corrupt of [
    (value) => { value.unknown_extension = true; },
    (value) => { value.authenticated_action_ref = { unsupported: 'object' }; },
    (value) => { value.redaction.verification_status = 'verified'; },
  ]) {
    for (const attach of [
      (value) => attachEvaluationEvidence(value, evaluationEntry()),
      (value) => attachToplocEvidence(value, toplocEntry(), { updatedAt: TIME }),
      (value) => bindExternalVerification(value, null, { actionReference: actionReference() }),
    ]) {
      const value = envelope();
      corrupt(value);
      value.evidence.envelope_hash = computeEnvelopeHash(value);
      assert.throws(() => attach(value), /Envelope v2 shape is invalid/);
    }
  }
});

test('tampering each new binding field preserves hash-mismatch refusal', () => {
  const original = envelope();
  assert.equal(evaluateTransactionAssuranceEnvelope(original, { now: TIME }).decision, 'allow');
  for (const path of newFields) {
    const value = structuredClone(original);
    const [section, field] = path.split('.');
    value[section][field] = value[section][field] === null ? 'tampered:fixture' : null;
    const result = evaluateTransactionAssuranceEnvelope(value, { now: TIME });
    assert.equal(result.decision, 'deny', path);
    assert.ok(result.blockers.includes('envelope_hash_mismatch'), path);
  }
});

test('unknown wire versions are refused by evaluator and every attachment consumer', () => {
  const value = envelope();
  value.schema = 'agoragentic.transaction-assurance-envelope.v999';
  value.evidence.envelope_hash = computeEnvelopeHash(value);
  for (const consume of [
    () => evaluateTransactionAssuranceEnvelope(value),
    () => attachEvaluationEvidence(value, evaluationEntry()),
    () => attachToplocEvidence(value, toplocEntry()),
    () => bindExternalVerification(value, null, { actionReference: actionReference() }),
  ]) assert.throws(consume, /supported transaction-assurance envelope schema/);
});

test('attachment cloning retains the existing process-local binding boundaries', () => {
  const original = envelope();
  bindTrustedEnvelope(original, { trust_mode: 'trusted_callback', verifier_ref: 'verifier:synthetic-binding',
    binding_hash: sha256Ref('synthetic-binding'), artifact_hash: original.authority.source_artifact_hash });
  assert.equal(trustedEnvelopeBinding(attachEvaluationEvidence(original, evaluationEntry())), null);
  assert.equal(trustedEnvelopeBinding(attachToplocEvidence(original, toplocEntry())), null);
  const bound = bindExternalVerification(original, null, { actionReference: actionReference() });
  assert.deepEqual(trustedEnvelopeBinding(bound), trustedEnvelopeBinding(original));
  const serialized = JSON.parse(JSON.stringify(original));
  assert.equal(trustedEnvelopeBinding(bindExternalVerification(serialized, null, { actionReference: actionReference() })), null);
});
