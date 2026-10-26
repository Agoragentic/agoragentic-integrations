'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');

const root = path.join(__dirname, '..');

function packagePath(packageName, format) {
	return path.join(
		root,
		'fixtures',
		'zod4-compat',
		'packages',
		packageName,
		'dist',
		format,
		'extensions',
		'string-extensions.js',
	);
}

async function loadExtensions(packageName, format) {
	const module = format === 'cjs'
		? require(packagePath(packageName, format))
		: await import(pathToFileURL(packagePath(packageName, format)).href);
	return module.stringExtensions.functions;
}

const adversarialMarkup = [
	'<ScRiPt>alert(1)</sCrIpT>',
	'prefix <script src="https://evil.test/x.js">alert(1)</script> suffix',
	'<div><SCRIPT><img src=x onerror=alert(1)></SCRIPT></div>',
	'prefix <script',
	'<svg:script href="x">payload</svg:script>',
	'<<script>script>',
	'<<img>img src=x onerror=alert(1)>',
	'<**script**>',
	'<**img** src=x onerror=alert(1)>',
	'<_custom>value</_custom>',
];

for (const packageName of ['n8n-workflow', 'expression-runtime']) {
	for (const format of ['cjs', 'esm']) {
		test(`${packageName} ${format} string sanitizers remove adversarial markup`, async () => {
			const functions = await loadExtensions(packageName, format);
			for (const input of adversarialMarkup) {
				for (const name of ['removeMarkdown', 'removeTags']) {
					const output = functions[name](input);
					assert.equal(typeof output, 'string');
					assert.doesNotMatch(output, /<\s*\/?\s*_custom\b/i);
					assert.doesNotMatch(output, /<\s*\/?\s*img\b/i);
					assert.doesNotMatch(output, /<\s*\/?\s*script\b/i, `${name} left a script tag in ${input}`);
					assert.doesNotMatch(output, /<\s*svg:script\b/i, `${name} left an SVG script tag in ${input}`);
				}
			}
		});
	}
}

test('string sanitizers preserve Markdown and ordinary less-than text behavior', async () => {
	for (const packageName of ['n8n-workflow', 'expression-runtime']) {
		for (const format of ['cjs', 'esm']) {
			const functions = await loadExtensions(packageName, format);
			assert.equal(functions.removeMarkdown('*bold*, [link](https://example.com)'), 'bold, link');
			assert.equal(functions.removeTags('price < 3; https://example.com/a?b=1'), 'price < 3; https://example.com/a?b=1');
		}
	}
});
