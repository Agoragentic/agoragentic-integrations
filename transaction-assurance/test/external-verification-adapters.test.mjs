import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  bindExternalVerification,
  buildTransactionAssuranceEnvelope,
  computeEnvelopeHash,
  MYCELIUM_EXTERNAL_VERIFICATION_PINS,
  normalizeAnchorEvidence,
  normalizeExternalActionReference,
  normalizeAuthorityArtifact,
  verifyAnchorEvidence,
  verifyExternalActionReferencePreimage,
} from '../src/index.mjs';

const actionVectors = JSON.parse(fs.readFileSync(
  new URL('./fixtures/mycelium-action-ref-v1.vectors.json', import.meta.url),
  'utf8',
));
const anchorVectors = JSON.parse(fs.readFileSync(
  new URL('./fixtures/mycelium-anchor-registry-v1.vectors.json', import.meta.url),
  'utf8',
));
const adapterSource = fs.readFileSync(
  new URL('../src/external-verification-adapters.mjs', import.meta.url),
  'utf8',
);
const clone = (value) => structuredClone(value);

function setPath(value, dotted, replacement) {
  const parts = dotted.split('.');
  let cursor = value;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = replacement;
}

function verifier(observation, inspect = () => {}) {
  return {
    id: observation.verifier_ref,
    verify(context) {
      inspect(context);
      return clone(observation);
    },
  };
}

function fixtureEnvelope(outcome = {}) {
  const envelope = buildTransactionAssuranceEnvelope({
    envelopeId: 'tae_external_fixture',
    createdAt: '2026-08-06T00:01:00Z',
    normalizedAuthority: normalizeAuthorityArtifact({
      owner_id: 'owner:external-fixture', buyer_agent_id: 'agent:external-fixture',
      scope: { allowed_actions: ['execute:fixture'], allowed_sellers: ['seller:fixture'],
        allowed_categories: ['fixture'], allowed_payment_rails: ['x402'] },
      budget: { currency: 'USD', max_per_action: '0', max_daily: '0', max_total: '0' },
    }),
    commercialIntent: { action: 'execute:fixture', taskRef: 'task:fixture',
      sellerRef: 'seller:fixture', capabilityRef: 'capability:fixture', category: 'fixture' },
    outcome: { deliveryStatus: outcome.delivery_status, verificationStatus: outcome.verification_status },
  });
  envelope.authenticated_action_ref = 'post_pin_auth:preserve-this-existing-field';
  envelope.evidence.envelope_hash = computeEnvelopeHash(envelope);
  return envelope;
}

function verifiedBaselineReference() {
  const fixture = actionVectors.fixtures.baseline;
  return verifyExternalActionReferencePreimage({
    profile: actionVectors.profile,
    value: fixture.value,
  }, fixture.preimage);
}

test('Mycelium profiles pin exact immutable source and registry facts', () => {
  const actionPin = MYCELIUM_EXTERNAL_VERIFICATION_PINS.action_ref_v1;
  const anchorPin = MYCELIUM_EXTERNAL_VERIFICATION_PINS.anchor_registry_v1;
  assert.equal(actionPin.revision, actionVectors.source.revision);
  assert.equal(actionPin.specification_sha256, actionVectors.source.specification_sha256);
  assert.equal(actionPin.vector_set_sha256, actionVectors.source.upstream_vector_set_sha256);
  assert.equal(actionPin.domain_separation, 'none');
  assert.equal(anchorPin.revision, anchorVectors.source.revision);
  assert.equal(anchorPin.registry_address, anchorVectors.source.registry_address);
  assert.equal(anchorPin.runtime_code_sha256, anchorVectors.source.runtime_code_sha256);
  assert.deepEqual(anchorPin.allowed_chain_ids, [
    'eip155:8453',
    'eip155:42161',
    'eip155:57073',
  ]);
});

test('action-reference vectors enforce the exact v1 profile and canonical preimage', () => {
  const baseline = actionVectors.fixtures.baseline;
  for (const vector of actionVectors.vectors) {
    const artifact = {
      profile: actionVectors.profile,
      value: baseline.value,
    };
    const preimage = clone(baseline.preimage);
    for (const [field, replacement] of Object.entries(vector.set || {})) {
      if (field.startsWith('preimage.')) setPath(preimage, field.slice('preimage.'.length), replacement);
      else artifact[field] = replacement;
    }
    const run = () => verifyExternalActionReferencePreimage(artifact, preimage);
    if (vector.expected === 'reject_out_of_profile_domain') {
      assert.throws(run, /OUT_OF_PROFILE_DOMAIN/, vector.id);
    } else if (vector.expected === 'reject_unsupported_profile') {
      assert.throws(run, /unsupported external action-reference profile/, vector.id);
    } else {
      assert.equal(run().recomputation, vector.expected, vector.id);
    }
  }
  const normalized = normalizeExternalActionReference({
    profile: actionVectors.profile,
    value: baseline.value,
  }, { artifactRef: 'fixture://mycelium/action-ref' });
  assert.equal(normalized.recomputation, 'not_checked');
  assert.deepEqual(normalized.limitations, ['no_protocol_domain_separation']);
  assert.equal(JSON.stringify(normalized).includes(baseline.preimage.agent_id), false);
});

test('the real Base anchor fixture reproduces a checked match without claiming delivery', () => {
  const fixture = anchorVectors.fixtures.base_real_anchor;
  const normalized = normalizeAnchorEvidence(fixture.evidence, {
    artifactRef: 'fixture://base/anchor',
  });
  const result = verifyAnchorEvidence(normalized, {
    verifier: verifier(fixture.verifier_observation, (context) => {
      assert.equal(Object.isFrozen(context), true);
      assert.equal(context.anchor_selector, '0xeecdf927');
      assert.equal(context.minimum_confirmations, 12);
    }),
  });
  assert.equal(result.status, 'checked_match');
  assert.deepEqual(result.failed_checks, []);
  assert.deepEqual(result.proves, [
    'reference_anchored',
    'public_block_timestamp',
    'event_inclusion',
  ]);
  assert.ok(result.does_not_prove.includes('delivery'));
  assert.ok(result.does_not_prove.includes('settlement'));
  assert.ok(result.does_not_prove.includes('single_execution'));
  assert.equal(result.log_index, 71);
  assert.equal(result.block_number, '48936665');
  assert.equal(result.raw_rpc_payload_embedded, false);
  assert.equal(JSON.stringify(result).includes('6080604052'), false);
});

test('anchor verification fails closed across code, receipt, call, event, and finality mutations', () => {
  const fixture = anchorVectors.fixtures.base_real_anchor;
  const cases = [
    ['runtime_code_hash', (value) => { value.runtime_code = '0x00'; }],
    ['receipt_success', (value) => { value.transaction_status = 'reverted'; }],
    ['call_selector', (value) => { value.transaction_input = `0x00000000${fixture.evidence.action_reference}`; }],
    ['calldata_reference', (value) => { value.transaction_input = `0xeecdf927${'a'.repeat(64)}`; }],
    ['event_present', (value) => { value.events = []; }],
    ['event_reference', (value) => { value.events[0].topics[1] = `0x${'a'.repeat(64)}`; }],
    ['event_block_hash', (value) => { value.events[0].block_hash = `0x${'a'.repeat(64)}`; }],
    ['event_timestamp', (value) => { value.events[0].data = `0x${'0'.repeat(63)}1`; }],
    ['finality', (value) => { value.head_block_number = value.block_number; }],
  ];
  for (const [check, mutate] of cases) {
    const observation = clone(fixture.verifier_observation);
    mutate(observation);
    const result = verifyAnchorEvidence(fixture.evidence, {
      verifier: verifier(observation),
    });
    assert.equal(result.status, 'checked_mismatch', check);
    assert.ok(result.failed_checks.includes(check), check);
    assert.deepEqual(result.proves, [], check);
  }
  const wrongLog = clone(fixture.evidence);
  wrongLog.log_index = 70;
  assert.ok(verifyAnchorEvidence(wrongLog, {
    verifier: verifier(fixture.verifier_observation),
  }).failed_checks.includes('event_present'));
  const wrongChain = clone(fixture.evidence);
  wrongChain.chain_id = 'eip155:1';
  assert.throws(() => normalizeAnchorEvidence(wrongChain), /unsupported anchor chain/);
  const wrongRegistry = clone(fixture.evidence);
  wrongRegistry.registry_address = '0x1111111111111111111111111111111111111111';
  assert.throws(() => normalizeAnchorEvidence(wrongRegistry), /not allowlisted/);
});

test('trusted verifier provenance is process-local and portable JSON cannot promote an anchor', () => {
  const fixture = anchorVectors.fixtures.base_real_anchor;
  assert.throws(() => verifyAnchorEvidence(fixture.evidence, {
    verifierEvidence: fixture.verifier_observation,
  }), /portable verifierEvidence JSON is not trusted/);
  assert.throws(() => verifyAnchorEvidence(fixture.evidence, {
    verifier: {
      id: fixture.verifier_observation.verifier_ref,
      async verify() { return clone(fixture.verifier_observation); },
    },
  }), /must return synchronously/);
  const withExtra = clone(fixture.verifier_observation);
  withExtra.claimed_delivery = true;
  assert.throws(() => verifyAnchorEvidence(fixture.evidence, {
    verifier: verifier(withExtra),
  }), /exact field set/);

  const normalized = normalizeAnchorEvidence(fixture.evidence);
  const bypassChain = clone(normalized);
  bypassChain.chain_id = 'eip155:1';
  assert.throws(() => verifyAnchorEvidence(bypassChain, {
    verifier: verifier(fixture.verifier_observation),
  }), /unsupported anchor chain/);
  const bypassRegistry = clone(normalized);
  bypassRegistry.registry_address = '0x1111111111111111111111111111111111111111';
  assert.throws(() => verifyAnchorEvidence(bypassRegistry, {
    verifier: verifier(fixture.verifier_observation),
  }), /not allowlisted/);
});

test('multiple observed anchors remain valid without becoming a uniqueness claim', () => {
  const fixture = anchorVectors.fixtures.base_real_anchor;
  const observation = clone(fixture.verifier_observation);
  const second = clone(observation.events[0]);
  second.transaction_hash = `0x${'c'.repeat(64)}`;
  second.log_index = 72;
  observation.events.push(second);
  const result = verifyAnchorEvidence(fixture.evidence, {
    verifier: verifier(observation),
  });
  assert.equal(result.status, 'checked_match');
  assert.equal(result.observed_matching_event_count, 2);
  assert.ok(result.does_not_prove.includes('single_execution'));
});

test('binding preserves authenticated identity and never upgrades outcome, payment, or reconciliation', () => {
  const actionReference = verifiedBaselineReference();
  const fixture = anchorVectors.fixtures.synthetic_baseline_anchor;
  const verification = verifyAnchorEvidence(fixture.evidence, {
    verifier: verifier(fixture.verifier_observation),
  });
  const envelope = fixtureEnvelope();
  const originalBytes = JSON.stringify(envelope);
  const previousHash = envelope.evidence.envelope_hash;
  const bound = bindExternalVerification(envelope, verification, { actionReference });
  assert.equal(JSON.stringify(envelope), originalBytes);
  assert.equal(bound.authenticated_action_ref, envelope.authenticated_action_ref);
  assert.equal(bound.external_action_refs.length, 1);
  assert.equal(bound.external_action_refs[0].recomputation, 'match');
  assert.equal(bound.external_verification.status, 'checked_match');
  assert.equal(bound.external_verification.complete_chain_verified, false);
  assert.equal(bound.outcome.delivery_status, 'not_observed');
  assert.equal(bound.outcome.verification_status, 'not_checked');
  assert.equal(bound.payment.status, 'not_started');
  assert.equal(bound.reconciliation.status, 'not_started');
  assert.equal(bound.state, 'incomplete');
  assert.notEqual(bound.evidence.envelope_hash, previousHash);
  assert.equal(bound.evidence.envelope_hash, computeEnvelopeHash(bound));
  assert.throws(() => bindExternalVerification(
    envelope,
    JSON.parse(JSON.stringify(verification)),
    { actionReference },
  ), /trusted in-process verifier boundary/);
  assert.throws(() => bindExternalVerification(
    envelope,
    verification,
    { actionReference: JSON.parse(JSON.stringify(actionReference)) },
  ), /trusted recomputation boundary/);

  const forgedMismatch = {
    ...JSON.parse(JSON.stringify(verification)),
    status: 'checked_mismatch',
    complete_chain_verified: true,
    authority_flags: { can_spend: true },
  };
  assert.throws(() => bindExternalVerification(
    envelope,
    forgedMismatch,
    { actionReference },
  ), /trusted in-process verifier boundary/);
});

test('delivery can remain verified while an unchecked external anchor remains not checked', () => {
  const actionReference = verifiedBaselineReference();
  const envelope = fixtureEnvelope({
    delivery_status: 'delivered',
    verification_status: 'verified',
  });
  const bound = bindExternalVerification(envelope, null, { actionReference });
  assert.equal(bound.outcome.delivery_status, 'delivered');
  assert.equal(bound.outcome.verification_status, 'verified');
  assert.equal(bound.external_verification.status, 'not_checked');
  assert.deepEqual(bound.external_verification.proves, []);
  assert.equal(bound.external_verification.complete_chain_verified, false);
});

test('external binding rejects a stale source hash and clears derived complete-chain claims', () => {
  const actionReference = verifiedBaselineReference();
  const envelope = fixtureEnvelope();
  envelope.payment.amount = '0.01';
  assert.throws(() => bindExternalVerification(envelope, null, { actionReference }), /envelope hash mismatch/);
  envelope.evidence.complete_chain_verified = true;
  envelope.evidence.envelope_hash = computeEnvelopeHash(envelope);
  const bound = bindExternalVerification(envelope, null, { actionReference });
  assert.equal(envelope.evidence.complete_chain_verified, true);
  assert.equal(bound.evidence.complete_chain_verified, false);
  assert.equal(bound.external_verification.assurance_binding.prior_envelope_hash, envelope.evidence.envelope_hash);
});

test('adapter is no-network and the package subpath exports the same API', async () => {
  assert.doesNotMatch(
    adapterSource,
    /from ['"]node:(?:http|https|net|tls)['"]|\bfetch\s*\(|eth_sendRawTransaction|sendTransaction\s*\(/,
  );
  const exported = await import('@agoragentic/transaction-assurance/external-verification-adapters');
  assert.equal(exported.verifyAnchorEvidence, verifyAnchorEvidence);
  assert.equal(exported.bindExternalVerification, bindExternalVerification);
});
