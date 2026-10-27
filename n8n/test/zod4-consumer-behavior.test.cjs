'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

// Exercise the installed package entrypoints. These checks intentionally do not
// import selected copied schemas or put a test-only validator in front of them.
for (const format of ['commonjs', 'esm']) {
	test(`workflow public consumer behavior (${format})`, async (t) => {
		const workflow = format === 'commonjs' ? require('n8n-workflow') : await import('n8n-workflow');

		await t.test('set-key-value records preserve strings/numbers and reject other values', () => {
			const input = { type: 'setKeyValue', properties: { count: 0, label: '' } };
			assert.deepEqual(workflow.IPostReceiveSetKeyValueSchema.parse(input), input);
			for (const value of [false, null, undefined, {}, []]) {
				assert.equal(workflow.IPostReceiveSetKeyValueSchema.safeParse({
					type: 'setKeyValue', properties: { value },
				}).success, false);
			}
		});

		await t.test('resource mapping preserves explicit falsy values without admitting containers', () => {
			const input = {
				mappingMode: 'defineBelow', value: { text: '', count: 0, flag: false, empty: null },
				matchingColumns: [], schema: [], attemptToConvertTypes: false, convertFieldsToString: false,
			};
			assert.deepEqual(workflow.ResourceMapperValueSchema.parse(input), input);
			for (const value of [{}, [], undefined]) {
				assert.equal(workflow.ResourceMapperValueSchema.safeParse({ ...input, value: { invalid: value } }).success, false);
			}
		});

		await t.test('credentials keep omission distinct from an empty record and allow upstream unknown values', () => {
			const absent = workflow.MessageEventBusDestinationOptionsSchema.parse({ circuitBreaker: {} });
			assert.equal(Object.hasOwn(absent, 'credentials'), false);
			const empty = workflow.MessageEventBusDestinationOptionsSchema.parse({ circuitBreaker: {}, credentials: {} });
			assert.equal(Object.hasOwn(empty, 'credentials'), true);
			assert.deepEqual(empty.credentials, {});
			const credentials = { nested: { list: [false, 0, null] } };
			assert.deepEqual(workflow.MessageEventBusDestinationOptionsSchema.parse({ circuitBreaker: {}, credentials }).credentials, credentials);
			for (const credentials of [null, [], 'invalid']) {
				assert.equal(workflow.MessageEventBusDestinationOptionsSchema.safeParse({ circuitBreaker: {}, credentials }).success, false);
			}
		});

		await t.test('generated defaults are validated before being returned', () => {
			for (const [type, value] of [['number', 0], ['boolean', false], ['string', '']]) {
				const schema = workflow.generateZodSchema({ key: 'fixture', type, defaultValue: value });
				assert.equal(schema.parse(undefined), value);
			}
			for (const [type, value] of [['number', 'invalid'], ['boolean', 0], ['string', false], ['json', {}]]) {
				const schema = workflow.generateZodSchema({ key: 'fixture', type, defaultValue: value });
				assert.equal(schema.safeParse(undefined).success, false, `${type} default must pass its validator`);
			}
		});

		await t.test('generated JSON schemas retain nonempty validation and existing metadata', () => {
			const schema = workflow.generateZodSchema({ key: 'fixture', type: 'json' });
			for (const value of [{ accepted: false }, [0]]) assert.deepEqual(schema.parse(value), value);
			for (const value of [{}, [], null, false, 'text']) assert.equal(schema.safeParse(value).success, false);
			assert.deepEqual(schema._def.jsonSchema, {
				anyOf: [
					{ type: 'object', minProperties: 1, additionalProperties: true },
					{ type: 'array', minItems: 1 },
				],
			});
		});

		await t.test('workflow structure validates shape and graph references separately', () => {
			const node = { name: 'Start', type: 'fixture', position: [0, 0], parameters: { flag: false } };
			const input = { nodes: [node], connections: { Start: { main: [null, []] } } };
			assert.deepEqual(workflow.parseWorkflowStructure(input), input);
			assert.equal(workflow.safeParseWorkflowStructure({ nodes: [{ ...node, position: [0] }], connections: {} }).success, false);
			const duplicate = workflow.safeParseWorkflowStructure({ nodes: [node, node], connections: {} });
			assert.equal(duplicate.success, false);
			assert.ok(duplicate.issues.some((issue) => issue.code === 'duplicate_node_name'));
			const source = workflow.safeParseWorkflowStructure({ nodes: [node], connections: { Unknown: {} } });
			assert.equal(source.success, false);
			assert.ok(source.issues.some((issue) => issue.code === 'unknown_connection_source'));
			const target = workflow.safeParseWorkflowStructure({ nodes: [node], connections: { Start: { main: [[{ node: 'Missing', type: 'main', index: 0 }]] } } });
			assert.equal(target.success, false);
			assert.ok(target.issues.some((issue) => issue.code === 'unknown_connection_target'));
		});

		await t.test('workflow issue formatting handles Zod 4 property keys without losing existing paths', () => {
			assert.equal(workflow.formatWorkflowStructureIssuePath([]), 'workflow');
			assert.equal(workflow.formatWorkflowStructureIssuePath(['nodes', 0, 'name']), 'nodes[0].name');
			assert.equal(workflow.formatWorkflowStructureIssuePath(['metadata', Symbol('fixture')]), 'metadata.Symbol(fixture)');
		});

		await t.test('actual unbounded consumer schemas retain their documented resource-limit boundary', () => {
			// This finite sample demonstrates compatibility, not a DoS resistance
			// claim. Host byte/depth/item budgets are still needed for unbounded schemas.
			const parameters = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [`key${index}`, index]));
			assert.deepEqual(workflow.INodeParametersSchema.parse(parameters), parameters);
			const sparse = workflow.INodesSchema.safeParse(new Array(1000));
			assert.equal(sparse.success, false);
			assert.ok(sparse.error.issues.length > 0 && sparse.error.issues.length <= 1000);
		});
	});
}

test('Zod schemas with explicit collection bounds reject before parsing oversized entries', () => {
	const { z } = require('zod');
	for (const kind of ['array', 'map', 'set']) {
		let visits = 0;
		const entry = z.unknown().superRefine(() => { visits += 1; });
		const schema = kind === 'array' ? z.array(entry).max(1)
			: kind === 'map' ? z.map(entry, entry).max(1) : z.set(entry).max(1);
		const input = kind === 'array' ? [0, 1]
			: kind === 'map' ? new Map([[0, false], [1, true]]) : new Set([0, 1]);
		assert.equal(schema.safeParse(input).success, false, `${kind} exceeds its explicit bound`);
		assert.equal(visits, 0, `${kind} must reject before invoking entry validators`);
	}
	let visits = 0;
	const sparse = z.array(z.unknown().superRefine(() => { visits += 1; })).max(1);
	assert.equal(sparse.safeParse(new Array(10000)).success, false);
	assert.equal(visits, 0);
});
