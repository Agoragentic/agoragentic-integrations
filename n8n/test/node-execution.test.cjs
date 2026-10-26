'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { NodeOperationError } = require('n8n-workflow');

// Execute the real source without relying on a stale dist directory. This is a
// behavior loader; the separate compiler/declaration checks provide type proof.
const filename = path.join(__dirname, '..', 'nodes', 'Agoragentic', 'Agoragentic.node.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	fileName: filename,
});
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled.outputText, filename);
const { Agoragentic } = loaded.exports;

const credentials = {
	baseUrl: 'https://router.example.test',
	edgeBaseUrl: 'https://edge.example.test',
	apiKey: 'fixture-not-a-real-api-key',
};

function context(parameters, options = {}) {
	const rows = Array.isArray(parameters) ? parameters : [parameters];
	return {
		getInputData: () => rows.map(() => ({ json: {} })),
		getNodeParameter: (name, index, fallback) =>
			Object.hasOwn(rows[index], name) ? rows[index][name] : fallback,
		getCredentials: async () => {
			if (options.missingCredentials) throw new Error('No credentials configured');
			return options.credentials || credentials;
		},
		continueOnFail: () => Boolean(options.continueOnFail),
		getNode: () => ({ id: 'fixture', name: 'Fixture', type: 'agoragentic', typeVersion: 1, parameters: {}, position: [0, 0] }),
	};
}

function mockFetch(t, responses) {
	const calls = [];
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		calls.push({ url: String(url), method: options.method, headers: new Headers(options.headers), body: options.body });
		assert.ok(responses.length, 'unexpected request; network access is stubbed');
		const response = responses.shift();
		if (response instanceof Error) throw response;
		return response;
	});
	return calls;
}

function json(body, status = 200, headers = {}) {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

const serviceIndex = () => json({ services: [{ slug: 'fixture', route_aliases: ['alias'], price_usdc: '0.1' }] });
const execute = (ctx) => Agoragentic.prototype.execute.call(ctx);

test('all router operations reject missing credentials before making a request', async (t) => {
	const calls = mockFetch(t, []);
	for (const operation of ['matchTask', 'executeTask', 'getReceipt']) {
		await assert.rejects(execute(context({ surface: 'router', operation, task: 'offline', receiptId: 'r' }, { missingCredentials: true })),
			(error) => error instanceof NodeOperationError && /API Key is required/.test(error.message));
	}
	assert.equal(calls.length, 0);
});

test('anonymous x402 challenge preserves headers without forwarding API credentials or retrying payment', async (t) => {
	const calls = mockFetch(t, [serviceIndex(), json({ error: 'payment_required' }, 402, {
		'payment-required': 'fixture-challenge', 'www-authenticate': 'fixture-auth',
	})]);
	const [[result]] = await execute(context({ surface: 'x402Edge', operation: 'callService', slug: 'alias', payload: { text: 'offline' } }));
	assert.equal(calls.length, 2);
	assert.equal(calls[1].url, 'https://edge.example.test/v1/fixture');
	assert.equal(calls[1].headers.get('authorization'), null);
	assert.equal(calls[1].headers.get('payment-signature'), null);
	assert.deepEqual(JSON.parse(calls[1].body), { text: 'offline' });
	assert.equal(result.json.statusCode, 402);
	assert.equal(result.json.headers.paymentRequired, 'fixture-challenge');
	assert.equal(result.json.headers.wwwAuthenticate, 'fixture-auth');
	assert.equal(result.pairedItem, 0);
});

test('explicit x402 retry forwards only the supplied signature and preserves response receipt headers', async (t) => {
	const calls = mockFetch(t, [serviceIndex(), json({ output: 'fixture-only' }, 200, {
		'payment-response': 'fixture-response', 'payment-receipt': 'fixture-receipt',
	})]);
	const [[result]] = await execute(context({ surface: 'x402Edge', operation: 'callService', slug: 'fixture', paymentSignature: 'fixture-signature' }));
	assert.equal(calls.length, 2);
	assert.equal(calls[1].headers.get('payment-signature'), 'fixture-signature');
	assert.equal(calls[1].headers.get('authorization'), null);
	assert.equal(result.json.headers.paymentResponse, 'fixture-response');
	assert.equal(result.json.headers.paymentReceipt, 'fixture-receipt');
});

test('price guard rejects an expensive quote before the service POST', async (t) => {
	const calls = mockFetch(t, [serviceIndex()]);
	await assert.rejects(execute(context({ surface: 'x402Edge', operation: 'callService', slug: 'fixture', maxPriceUsdc: 0.01 })), /exceeds max price/);
	assert.equal(calls.length, 1);
	assert.equal(calls[0].method, 'GET');
});

test('invalid payload objects fail before any fetch', async (t) => {
	const calls = mockFetch(t, []);
	for (const payload of ['[]', 'false', '1', 'null', [], 2, '{invalid']) {
		await assert.rejects(execute(context({ surface: 'x402Edge', operation: 'callService', slug: 'fixture', payload })), NodeOperationError);
	}
	assert.equal(calls.length, 0);
});

test('router execution preserves false/zero/null input and reports HTTP failures without retrying', async (t) => {
	const calls = mockFetch(t, [json({ error: 'fixture_failure' }, 503)]);
	const [[result]] = await execute(context({ surface: 'router', operation: 'executeTask', task: 'offline task', input: '{"flag":false,"count":0,"empty":null}', constraints: { max_cost_usdc: 0 } }));
	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, 'https://router.example.test/api/execute');
	assert.equal(calls[0].headers.get('authorization'), 'Bearer fixture-not-a-real-api-key');
	assert.deepEqual(JSON.parse(calls[0].body), { task: 'offline task', input: { flag: false, count: 0, empty: null }, constraints: { max_cost_usdc: 0 } });
	assert.equal(result.json.statusCode, 503);
	assert.deepEqual(result.json.data, { error: 'fixture_failure' });
});

test('transport errors use the real n8n error boundary, with continue-on-fail preserving item pairing', async (t) => {
	const calls = mockFetch(t, [new Error('fixture network unavailable'), new Response('plain fixture body', { status: 502 })]);
	const [results] = await execute(context([
		{ surface: 'x402Edge', operation: 'getEdgeReceipt', receiptId: 'first' },
		{ surface: 'x402Edge', operation: 'getEdgeReceipt', receiptId: 'second/part' },
	], { continueOnFail: true }));
	assert.deepEqual(results[0], { json: { error: 'fixture network unavailable' }, pairedItem: 0 });
	assert.equal(results[1].pairedItem, 1);
	assert.equal(results[1].json.statusCode, 502);
	assert.equal(results[1].json.data, 'plain fixture body');
	assert.equal(calls[1].url, 'https://edge.example.test/v1/receipts/second%2Fpart');
});

test('unsupported operations fail closed and preserve the real NodeOperationError class', async (t) => {
	const calls = mockFetch(t, []);
	await assert.rejects(execute(context({ surface: 'router', operation: 'unknown' })),
		(error) => error instanceof NodeOperationError && /Unsupported operation/.test(error.message));
	assert.equal(calls.length, 0);
});

test('non-finite or negative price caps are rejected before a paid call', async (t) => {
	for (const maxPriceUsdc of [NaN, Infinity, -Infinity, -1, 'Infinity', '', '  ', true, null, []]) {
		const calls = mockFetch(t, [serviceIndex(), json({ output: 'must not be requested' })]);
		await assert.rejects(execute(context({ surface: 'x402Edge', operation: 'callService', slug: 'fixture', maxPriceUsdc })), /finite non-negative/);
		assert.equal(calls.some((call) => call.method === 'POST'), false);
		t.mock.restoreAll();
	}
});

test('invalid remote prices cannot bypass a finite spending cap', async (t) => {
	for (const price of ['not-a-price', 'Infinity', '-1', '', ' ', true, [], null, undefined]) {
		const calls = mockFetch(t, [json({ services: [{ slug: 'fixture', price_usdc: price }] }), json({ output: 'must not be requested' })]);
		await assert.rejects(execute(context({ surface: 'x402Edge', operation: 'callService', slug: 'fixture', maxPriceUsdc: 1 })), /finite non-negative/);
		assert.equal(calls.some((call) => call.method === 'POST'), false);
		t.mock.restoreAll();
	}
});

test('valid zero prices and numeric strings preserve quote and call behavior', async (t) => {
	for (const operation of ['quoteService', 'callService']) {
		const responses = [json({ services: [{ slug: 'fixture', price_usdc: '0' }] })];
		if (operation === 'callService') responses.push(json({ result: 'offline fixture' }));
		const calls = mockFetch(t, responses);
		const [[result]] = await execute(context({ surface: 'x402Edge', operation, slug: 'fixture', maxPriceUsdc: '0' }));
		assert.equal(result.json.statusCode, 200);
		assert.equal(calls.length, operation === 'callService' ? 2 : 1);
		t.mock.restoreAll();
	}
});

test('quote validation also rejects invalid prices and caps', async (t) => {
	let calls = mockFetch(t, []);
	await assert.rejects(execute(context({ surface: 'x402Edge', operation: 'quoteService', slug: 'fixture', maxPriceUsdc: NaN })), /finite non-negative/);
	assert.equal(calls.length, 0);
	t.mock.restoreAll();
	calls = mockFetch(t, [json({ services: [{ slug: 'fixture', price_usdc: 'bad' }] })]);
	await assert.rejects(execute(context({ surface: 'x402Edge', operation: 'quoteService', slug: 'fixture' })), /finite non-negative/);
	assert.equal(calls.length, 1);
});
