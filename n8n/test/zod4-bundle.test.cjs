'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const bundleRoot = path.join(
	root,
	'fixtures',
	'zod4-compat',
	'packages',
	'expression-runtime',
	'dist',
	'bundle',
);
const globals = [
	'extend',
	'extendOptional',
	'DateTime',
	'Duration',
	'Interval',
	'SafeObject',
	'SafeError',
	'ExpressionError',
	'createDeepLazyProxy',
	'buildContext',
	'__prepareForTransfer',
];

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertRuntimeGlobals(target) {
	for (const name of globals) {
		assert.ok(name in target, `${name} was not installed by the runtime bundle`);
		assert.notEqual(target[name], undefined, `${name} was undefined`);
	}
	for (const name of [
		'extend',
		'extendOptional',
		'createDeepLazyProxy',
		'buildContext',
		'__prepareForTransfer',
	]) {
		assert.equal(typeof target[name], 'function', `${name} is not callable`);
	}
}

test('regenerated IIFE runtime loads in a bounded isolated context', () => {
	const filename = path.join(bundleRoot, 'runtime.iife.js');
	const sandbox = {};
	vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, {
		filename,
		timeout: 1000,
	});
	assertRuntimeGlobals(sandbox);
});

test('regenerated ESM runtime loads in a bounded child process', () => {
	const filename = path.join(bundleRoot, 'runtime.esm.js');
	const script = [
		"const fs = require('node:fs');",
		"const code = fs.readFileSync(process.argv[1], 'utf8');",
		"(async () => {",
		"  await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(code));",
		`  const names = ${JSON.stringify(globals)};`,
		"  for (const name of names) { if (!(name in globalThis) || globalThis[name] === undefined) throw new Error(name + ' missing'); }",
		"  for (const name of ['extend', 'extendOptional', 'createDeepLazyProxy', 'buildContext', '__prepareForTransfer']) { if (typeof globalThis[name] !== 'function') throw new Error(name + ' not callable'); }",
		"})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });",
	].join('\n');
	const result = spawnSync(process.execPath, ['-e', script, filename], {
		encoding: 'utf8',
		timeout: 3000,
		windowsHide: true,
	});
	assert.equal(result.error, undefined, result.error?.message);
	assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('runtime bundle source maps retain the pinned runtime entrypoint', () => {
	for (const name of ['runtime.iife.js', 'runtime.esm.js']) {
		const map = JSON.parse(read(path.join(
			'fixtures',
			'zod4-compat',
			'packages',
			'expression-runtime',
			'dist',
			'bundle',
			`${name}.map`,
		)));
		assert.ok(
			map.sources.some((source) => source.endsWith('/src/runtime/index.ts')),
			`${name} map does not identify src/runtime/index.ts`,
		);
	}
});
