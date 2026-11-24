import { schnorr } from '@noble/secp256k1';
import { BuzzEvidenceError, canonicalBuzzEventId } from '../buzz-event-evidence.mjs';

const MAX_EVENT_WIRE_BYTES = 65_536;
const EVENT_FIELDS = new Set(['id', 'pubkey', 'created_at', 'kind', 'tags', 'content', 'sig']);
const HEX_32 = /^[a-f0-9]{64}$/;
const HEX_64 = /^[a-f0-9]{128}$/;

// This local result establishes only whether the supplied key signed the
// canonical event ID. Nothing consumes it as a principal or authority grant.
export async function verifyBuzzEventSignature(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new BuzzEvidenceError('invalid_event', 'Expected a NIP-01 event object.');
  }

  const fields = Object.keys(event);
  if (fields.length !== EVENT_FIELDS.size || fields.some(field => !EVENT_FIELDS.has(field))) {
    throw new BuzzEvidenceError('invalid_event', 'Expected only the seven NIP-01 event fields.');
  }

  const { id, pubkey, created_at, kind, tags, content, sig } = event;
  if (typeof id !== 'string' || id.length !== 64 || !HEX_32.test(id) ||
      typeof pubkey !== 'string' || pubkey.length !== 64 || !HEX_32.test(pubkey) ||
      typeof sig !== 'string' || sig.length !== 128 || !HEX_64.test(sig)) {
    throw new BuzzEvidenceError('invalid_event', 'Expected lowercase hexadecimal event ID, public key and signature.');
  }

  const expectedId = canonicalBuzzEventId({ pubkey, created_at, kind, tags, content });
  if (tags.includes(undefined) || tags.some(tag => tag.includes(undefined))) {
    throw new BuzzEvidenceError('invalid_event', 'Expected dense arrays of tag strings.');
  }
  const wire = JSON.stringify({ id, pubkey, created_at, kind, tags, content, sig });
  if (Buffer.byteLength(wire, 'utf8') > MAX_EVENT_WIRE_BYTES) {
    throw new BuzzEvidenceError('event_too_large', 'Event exceeds the signature verifier wire limit.');
  }
  if (id !== expectedId) {
    throw new BuzzEvidenceError('event_id_mismatch', 'Event ID does not match the canonical NIP-01 event.');
  }

  return schnorr.verifyAsync(Buffer.from(sig, 'hex'), Buffer.from(expectedId, 'hex'), Buffer.from(pubkey, 'hex'));
}
