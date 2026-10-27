const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const descriptorPath = path.join(__dirname, '..', 'fixtures', 'zod4-compat', 'security-patches', 'workflow-security.json');
const patches = JSON.parse(fs.readFileSync(descriptorPath, 'utf8'));

test('security descriptor is explicit and source-bound', () => {
	assert.ok(patches.length >= 5);
	for (const patch of patches) {
		assert.match(patch.path, /^packages\/workflow\/src\//);
		assert.equal(typeof patch.before, 'string');
		assert.equal(typeof patch.after, 'string');
		assert.equal(typeof patch.reason, 'string');
		assert.notEqual(patch.before, patch.after);
	}
	assert.ok(patches.some((patch) => patch.reason.includes('rejection')));
	assert.ok(patches.some((patch) => patch.reason.includes('__proto__')));
});

function withRandomWords(words, callback) {
	const original = globalThis.crypto;
	let index = 0;
	Object.defineProperty(globalThis, 'crypto', {
		configurable: true,
		value: {
			getRandomValues(array) {
				if (index >= words.length) throw new Error('random stub exhausted');
				array[0] = words[index++];
				return array;
			},
		},
	});
	try {
		return callback();
	} finally {
		Object.defineProperty(globalThis, 'crypto', { configurable: true, value: original });
	}
}

function exerciseWorkflowSecurity(workflow) {
	const { randomInt, randomString } = workflow;
	assert.equal(withRandomWords([0xffffffff, 1431655765], () => randomInt(3)), 1);
	assert.equal(withRandomWords([1, 1, 1], () => randomString(3)), workflow.ALPHABET.at(1).repeat(3));
	assert.equal(withRandomWords(Array(16_384).fill(1), () => randomString(16_384)).length, 16_384);
	assert.throws(() => withRandomWords([], () => randomString(16_385)), (error) => error.name === 'QuotaExceededError');
	assert.throws(() => withRandomWords([], () => randomString(Number.MAX_SAFE_INTEGER)), (error) => error.name === 'QuotaExceededError');
	assert.throws(() => withRandomWords([], () => randomString(Infinity)), RangeError);
	assert.equal(withRandomWords([0], () => randomInt(10)), 0);
	assert.equal(withRandomWords([9], () => randomInt(10)), 9);
	assert.equal(withRandomWords([15, 9], () => randomInt(10)), 9);
	assert.equal(withRandomWords([0xffffffff, 9], () => randomInt(10)), 9);
	assert.equal(withRandomWords([4], () => randomInt(5, 15)), 9);
	assert.equal(withRandomWords([0xffffffff], () => randomInt(8)), 7);
	assert.equal(withRandomWords([0xffffffff], () => randomInt(1)), 0);
	assert.equal(withRandomWords([0xffffffff], () => randomInt(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER - 1);
	assert.equal(withRandomWords([0xffffffff], () => randomInt(0, 0x1_0000_0000)), 0xffffffff);
	assert.throws(() => randomInt(0.5, 2.5), RangeError);
	assert.throws(() => randomInt(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 2), RangeError);
	assert.throws(() => randomInt(Number.MAX_SAFE_INTEGER + 1), RangeError);
	assert.throws(() => randomString(-1), RangeError);

	// Exhaustive small-domain analogue: M256/range10 uses mask 15,
	// accepts ten buckets of 16 values, and rejects 96 masked values.
	const accepted = Array.from({ length: 256 }, (_, value) => value & 15).filter((value) => value < 10);
	assert.equal(accepted.length, 160);
	assert.equal(256 - accepted.length, 96);
	assert.deepEqual(accepted.reduce((counts, bucket) => { counts[bucket]++; return counts; }, Array(10).fill(0)), Array(10).fill(16));

	const malicious = JSON.parse('{"__proto__":{"main":[[{"node":"__proto__","type":"main","index":0}]]}}');
	const mapped = workflow.mapConnectionsByDestination(malicious);
	assert.equal(Object.getPrototypeOf(mapped), Object.prototype);
	assert.ok(Object.prototype.hasOwnProperty.call(mapped, '__proto__'));
	const workflowMapped = workflow.Workflow.getConnectionsByDestination(malicious);
	assert.equal(Object.getPrototypeOf(workflowMapped), Object.prototype);
	assert.ok(Object.prototype.hasOwnProperty.call(workflowMapped, '__proto__'));
	const maliciousNested = JSON.parse('{"source":{"main":[[{"node":"hasOwnProperty","type":"__proto__","index":0}]]}}');
	for (const mappedBy of [workflow.mapConnectionsByDestination(maliciousNested), workflow.Workflow.getConnectionsByDestination(maliciousNested)]) {
		assert.equal(Object.getPrototypeOf(mappedBy), Object.prototype);
		assert.ok(Object.prototype.hasOwnProperty.call(mappedBy, 'hasOwnProperty'));
		assert.ok(Object.prototype.hasOwnProperty.call(mappedBy.hasOwnProperty, '__proto__'));
	}

	const nodeTypes = { getByNameAndVersion: () => undefined };
	const graph = (url) =>
		workflow.TelemetryHelpers.generateNodesGraph(
			{
				nodes: [{ id: 'node', name: 'tool', type: '@n8n/n8n-nodes-langchain.toolHttpRequest', typeVersion: 1, position: [0, 0], parameters: { url } }],
			},
			nodeTypes,
		).nodeGraph.nodes['0'].toolSettings.url_type;
	assert.equal(graph('https://api.google.com/tool'), 'google');
	assert.equal(graph('https://evilgoogle.com/tool'), 'other');
	assert.equal(graph('https://google.com.evil.test/tool'), 'other');
}

test('CJS public workflow security boundaries are deterministic', () => {
	const workflow = require('n8n-workflow');
	const common = require('n8n-workflow/common');
	exerciseWorkflowSecurity({ ...workflow, ...common });
});

test('ESM public workflow security boundaries are deterministic', async () => {
	const workflow = await import('n8n-workflow');
	const common = await import('n8n-workflow/common');
	exerciseWorkflowSecurity({ ...workflow, ...common });
});
