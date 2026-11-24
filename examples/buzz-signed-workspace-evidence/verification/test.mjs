import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { schnorr } from '@noble/secp256k1';
import { compileBuzzEvidenceBundle, verifyBuzzEvidenceBundle } from '../buzz-event-evidence.mjs';
import { verifyBuzzEventSignature } from './verify-event.mjs';

const fromHex = value => Buffer.from(value, 'hex');
const toHex = value => Buffer.from(value).toString('hex');
const vectors = JSON.parse(await readFile(new URL('./bip340-verification-vectors.json', import.meta.url), 'utf8'));

function independentId(event) {
  const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
  return createHash('sha256').update(serialized).digest('hex');
}

const scalar = Buffer.alloc(32);
scalar[31] = 3; // Public BIP-340 test scalar, never an operational identity.
const event = {
  pubkey: toHex(schnorr.getPublicKey(scalar)),
  created_at: 1786000000,
  kind: 9,
  tags: [['h', 'synthetic-channel'], ['note', 'synthetic note']],
  content: 'Synthetic evidence "quote" \nline 🌎',
};
event.id = independentId(event);
event.sig = toHex(await schnorr.signAsync(fromHex(event.id), scalar, Buffer.alloc(32)));
Object.freeze(event);

test('the locked dependency matches all published BIP-340 verification vectors', async () => {
  assert.equal(vectors.vectors.length, 19);
  assert.equal(vectors.vectors.filter(row => row.valid).length, 9);
  for (const row of vectors.vectors) {
    const actual = await schnorr.verifyAsync(fromHex(row.signature), fromHex(row.message), fromHex(row.public_key));
    assert.equal(actual, row.valid, 'BIP-340 vector ' + row.index);
  }
});

test('a synthetic NIP-01 event verifies without mutating any input or elevating legacy evidence', async () => {
  const before = structuredClone(event);
  assert.equal(await verifyBuzzEventSignature(event), true);
  await assert.rejects(
    verifyBuzzEventSignature({ ...event, unsigned_label: 'x'.repeat(70_000) }),
    { code: 'invalid_event' },
  );
  assert.deepEqual(event, before);
  const bundle = compileBuzzEvidenceBundle({ events: [event] });
  assert.equal(bundle.events[0].signature.signature_valid, null);
  assert(Object.values(bundle.authority).every(value => value === false));
  assert.equal(verifyBuzzEvidenceBundle(bundle).valid, true);
});

test('rejects edited content with the old ID and refuses the recomputed ID with the old signature', async () => {
  const edited = { ...event, content: 'A different synthetic note' };
  await assert.rejects(verifyBuzzEventSignature(edited), { code: 'event_id_mismatch' });
  edited.id = independentId(edited);
  assert.equal(await verifyBuzzEventSignature(edited), false);
});

test('rejects the original signature after replacing the public key, tag order, timestamp or kind', async () => {
  const otherScalar = Buffer.alloc(32);
  otherScalar[31] = 5;
  const edits = [
    { pubkey: toHex(schnorr.getPublicKey(otherScalar)) },
    { tags: [...event.tags].reverse() },
    { created_at: event.created_at + 1 },
    { kind: 1 },
  ];
  for (const edit of edits) {
    const changed = { ...event, ...edit };
    changed.id = independentId(changed);
    assert.equal(await verifyBuzzEventSignature(changed), false);
  }
});

test('a changed signature and a non-curve public key cannot verify', async () => {
  const alteredSig = fromHex(event.sig);
  alteredSig[alteredSig.length - 1] ^= 1;
  assert.equal(await verifyBuzzEventSignature({ ...event, sig: toHex(alteredSig) }), false);
  const badKey = { ...event, pubkey: 'ff'.repeat(32) };
  badKey.id = independentId(badKey);
  assert.equal(await verifyBuzzEventSignature(badKey), false);
});

test('fails closed on malformed and oversized input', async () => {
  for (const input of [
    null,
    { ...event, sig: event.sig.toUpperCase() },
    { ...event, sig: event.sig + '\n' },
    { ...event, sig: '21' },
    { ...event, id: event.id + '\n' },
    { ...event, tags: [['h', 12]] },
    { ...event, tags: Array(1) },
    { ...event, tags: [Array(1)] },
  ]) {
    await assert.rejects(verifyBuzzEventSignature(input), { code: 'invalid_event' });
  }
  const large = { ...event, tags: Array.from({ length: 17 }, () => ['note', 'x'.repeat(4000)]) };
  large.id = independentId(large);
  await assert.rejects(verifyBuzzEventSignature(large), { code: 'event_too_large' });
});
