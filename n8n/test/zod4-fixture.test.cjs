'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const fixture = path.join(root, 'fixtures', 'zod4-compat');
const packages = path.join(fixture, 'packages');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const read = (file) => fs.readFileSync(file, 'utf8');

test('maintained Zod 4 fixture is source-bound and development-only', () => {
	const manifest = readJson(path.join(fixture, 'manifest.json'));
	const workflow = readJson(path.join(packages, 'n8n-workflow', 'package.json'));
	const expression = readJson(path.join(packages, 'expression-runtime', 'package.json'));
	const published = readJson(path.join(root, 'package.json'));

	assert.equal(manifest.schema, 'agoragentic.n8n.zod4-compat-fixture.v1');
	assert.equal(manifest.source_commit, '955be3ef2131afb9ecba5482024d045e710e4f20');
	assert.equal(workflow.version, '2.28.4');
	assert.equal(expression.version, '0.19.1');
	assert.equal(workflow.xAgoragenticFixture.zodVersion, '4.6.7');
	assert.equal(expression.xAgoragenticFixture.zodVersion, '4.6.7');
	assert.equal(published.version, '0.1.4');
	assert.equal(published.peerDependencies['n8n-workflow'], '*');
	assert.equal(published.overrides, undefined);
	assert.equal(workflow.peerDependencies.zod, '4.6.7');
	assert.equal(expression.dependencies.zod, '4.6.7');
	assert.equal(readJson(path.join(packages, 'n8n-workflow', 'dist', 'cjs', 'package.json')).type, 'commonjs');
	assert.equal(readJson(path.join(packages, 'expression-runtime', 'dist', 'cjs', 'package.json')).type, 'commonjs');
	assert.equal(fs.existsSync(path.join(packages, 'n8n-workflow', 'LICENSE.md')), true);
	assert.equal(fs.existsSync(path.join(packages, 'n8n-workflow', 'LICENSE_EE.md')), true);
	assert.equal(fs.existsSync(path.join(packages, 'expression-runtime', 'LICENSE.md')), true);
	assert.equal(fs.existsSync(path.join(packages, 'expression-runtime', 'LICENSE_EE.md')), true);
});

test('generated CJS and ESM record and optional declarations reflect the source migration', () => {
	const esmSchemas = read(path.join(packages, 'n8n-workflow', 'dist', 'esm', 'schemas.js'));
	const cjsSchemas = read(path.join(packages, 'n8n-workflow', 'dist', 'cjs', 'schemas.js'));
	const esmBus = read(path.join(packages, 'n8n-workflow', 'dist', 'esm', 'message-event-bus.js'));
	const cjsBus = read(path.join(packages, 'n8n-workflow', 'dist', 'cjs', 'message-event-bus.js'));
	const esmBridge = read(path.join(packages, 'expression-runtime', 'dist', 'esm', 'bridge', 'bridge-messages.js'));
	const cjsBridge = read(path.join(packages, 'expression-runtime', 'dist', 'cjs', 'bridge', 'bridge-messages.js'));

	for (const source of [esmSchemas, cjsSchemas]) {
		assert.match(source, /record\([^\n]*string\(\),[^\n]*union/);
	}
	assert.match(esmBus, /credentials: z\.record\(z\.string\(\), z\.unknown\(\)\)\.optional\(\)/);
	assert.match(cjsBus, /credentials: zod_1\.z\.record\(zod_1\.z\.string\(\), zod_1\.z\.unknown\(\)\)\.optional\(\)/);
	assert.match(esmBridge, /defaultValue: z\.unknown\(\)\.optional\(\)/);
	assert.match(cjsBridge, /defaultValue: zod_1\.z\.unknown\(\)\.optional\(\)/);
	assert.match(read(path.join(packages, 'expression-runtime', 'dist', 'esm', 'bridge', 'bridge-messages.d.ts')), /defaultValue: z\.ZodOptional<z\.ZodUnknown>/);
});

test('public package roots and reviewed bridge subpath load in both module formats', async () => {
	const esmWorkflow = await import('n8n-workflow');
	const esmBridge = await import('../fixtures/zod4-compat/packages/expression-runtime/dist/esm/bridge/bridge-messages.js');
	const cjsWorkflow = require('n8n-workflow');
	const cjsBridge = require('../fixtures/zod4-compat/packages/expression-runtime/dist/cjs/bridge/bridge-messages.js');
	for (const workflow of [esmWorkflow, cjsWorkflow]) {
		assert.equal(workflow.IPostReceiveSetKeyValueSchema.parse({ type: 'setKeyValue', enabled: true, properties: { answer: 42 } }).properties.answer, 42);
		assert.throws(() => workflow.IPostReceiveSetKeyValueSchema.parse({ type: 'setKeyValue', enabled: true, properties: { answer: true } }));
		assert.throws(() => workflow.MessageEventBusDestinationOptionsSchema.parse({ circuitBreaker: {}, credentials: [] }));
	}
	for (const bridge of [esmBridge, cjsBridge]) {
		assert.deepEqual(bridge.fromAiMessage.parse({ type: 'fromAi' }), { type: 'fromAi' });
		assert.equal(bridge.fromAiMessage.parse({ type: 'fromAi', defaultValue: false }).defaultValue, false);
		assert.throws(() => bridge.fromAiMessage.parse({ type: 'fromAi', extra: true }));
	}
});

test('dedicated full-source compiler closure is lock-bound and complete', () => {
	const manifest = readJson(path.join(fixture, 'manifest.json'));
	const lockPath = path.join(fixture, 'build', 'package-lock.json');
	const lockHash = crypto.createHash('sha256').update(fs.readFileSync(lockPath)).digest('hex');
	assert.equal(`sha256:${lockHash}`, manifest.build_toolchain.lockfile_sha256);
	assert.equal(readJson(path.join(fixture, 'build', 'package.json')).devDependencies.zod, '4.6.7');
	for (const relative of [
		'n8n-workflow/dist/esm/index.d.ts',
		'n8n-workflow/dist/cjs/index.d.ts',
		'expression-runtime/dist/esm/index.d.ts',
		'expression-runtime/dist/cjs/index.d.ts',
	]) assert.equal(fs.existsSync(path.join(packages, relative)), true, relative);
});
