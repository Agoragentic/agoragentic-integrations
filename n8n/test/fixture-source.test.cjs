'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { gzipSync } = require('node:zlib');

const commit = 'a'.repeat(40);
const prefix = `n8n-${commit}`;
const required = [
	'packages/workflow/', 'packages/workflow/src/index.ts',
	'packages/@n8n/expression-runtime/', 'packages/@n8n/expression-runtime/src/index.ts',
	'packages/@n8n/typescript-config/', 'packages/@n8n/typescript-config/tsconfig.json',
	'packages/@n8n/config/src/configs/logging.config.ts',
	'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'tsconfig.json', 'LICENSE.md', 'LICENSE_EE.md',
];

// Tiny deterministic tar fixtures avoid downloads and do not require permission
// to create real filesystem symlinks for the archive-link rejection case.
function archive(extra = [], omitted = []) {
	const entries = required.filter((name) => !omitted.includes(name)).map((name) => ({
		name: `${prefix}/${name}`, type: name.endsWith('/') ? '5' : '0',
		body: name.endsWith('/') ? '' : `fixture:${name}\n`,
	})).concat(extra);
	const chunks = [];
	for (const { name, type = '0', body = '', link = '' } of entries) {
		const data = Buffer.from(body);
		const header = Buffer.alloc(512);
		assert.ok(Buffer.byteLength(name) <= 100);
		header.write(name, 0, 100);
		// Directories need traversal permission on POSIX; files stay non-executable.
		header.write(type === '5' ? '0000755\0' : '0000644\0', 100, 8);
		header.write('0000000\0', 108, 8);
		header.write('0000000\0', 116, 8);
		header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124, 12);
		header.write('00000000000\0', 136, 12);
		header.fill(32, 148, 156);
		header.write(type, 156, 1);
		header.write(link, 157, 100);
		header.write('ustar\0', 257, 6);
		header.write('00', 263, 2);
		const sum = header.reduce((value, byte) => value + byte, 0);
		header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 8);
		chunks.push(header, data, Buffer.alloc((512 - data.length % 512) % 512));
	}
	chunks.push(Buffer.alloc(1024));
	return gzipSync(Buffer.concat(chunks));
}

async function setup(t, bytes) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agoragentic-fixture-source-test-'));
	t.after(async () => {
		const absolute = path.resolve(root);
		const relative = path.relative(path.resolve(os.tmpdir()), absolute);
		assert.ok(relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative));
		assert.ok(path.basename(absolute).startsWith('agoragentic-fixture-source-test-'));
		await fs.rm(absolute, { recursive: true, force: true });
	});
	const archivePath = path.join(root, 'input.tar.gz');
	await fs.writeFile(archivePath, bytes);
	const api = await import('../scripts/fixture-source.mjs');
	return { root, archivePath, api, sha256: api.sha256Bytes(bytes) };
}

test('archive verification uses an owned copy and inventories selected source bytes', async (t) => {
	const { root, archivePath, api, sha256 } = await setup(t, archive([
		{ name: `${prefix}/.claude/unselected`, type: '2', link: '../outside' },
	]));
	const owned = await api.loadVerifiedArchive({ archivePath, commit, sha256 });
	t.after(() => owned.cleanup());
	await fs.writeFile(archivePath, 'changed external cache');
	const extracted = await api.extractSourceArchive({ ...owned, commit, sha256, workDir: path.join(root, 'extracted') });
	const before = await api.inventoryFiles(extracted);
	assert.equal(before.length, required.filter((name) => !name.endsWith('/')).length);
	assert.ok(before.every((entry) => !entry.path.startsWith('.claude/')));
	assert.equal(await fs.readFile(path.join(extracted, 'packages/workflow/src/index.ts'), 'utf8'), 'fixture:packages/workflow/src/index.ts\n');
	await fs.appendFile(path.join(extracted, 'packages/workflow/src/index.ts'), 'changed');
	assert.notDeepEqual(await api.inventoryFiles(extracted), before);
});

test('wrong archive digest fails before extraction', async (t) => {
	const { archivePath, api } = await setup(t, archive());
	await assert.rejects(api.loadVerifiedArchive({ archivePath, commit, sha256: '0'.repeat(64) }), /SHA-256 mismatch/);
});

test('traversal and selected links are rejected before archive extraction', async (t) => {
	for (const entry of [
		{ name: `${prefix}/../outside`, body: 'not extracted' },
		{ name: `${prefix}/packages/workflow/escape`, type: '2', link: '../../outside' },
		{ name: `${prefix}/packages/workflow/hardlink`, type: '1', link: `${prefix}/LICENSE.md` },
		{ name: `${prefix}/packages/workflow/pipe`, type: '6' },
		{ name: `${prefix}/packages/workflow/device`, type: '3' },
	]) {
		const { root, archivePath, api, sha256 } = await setup(t, archive([entry]));
		const workDir = path.join(root, 'extracted');
		await assert.rejects(api.extractSourceArchive({ archivePath, workDir, commit, sha256 }), /Unsafe archive entry|Links are not allowed|Unsupported archive entry type/);
		assert.deepEqual(await fs.readdir(workDir), []);
	}
});

test('missing selected sources and nonempty output directories fail closed', async (t) => {
	const { root, archivePath, api, sha256 } = await setup(t, archive([], ['LICENSE.md']));
	await assert.rejects(api.extractSourceArchive({ archivePath, workDir: path.join(root, 'missing'), commit, sha256 }), /Missing required upstream source/);
	const nonempty = path.join(root, 'occupied');
	await fs.mkdir(nonempty);
	await fs.writeFile(path.join(nonempty, 'keep'), 'retain');
	await assert.rejects(api.extractSourceArchive({ archivePath, workDir: nonempty, commit, sha256 }), /empty regular directory/);
	assert.equal(await fs.readFile(path.join(nonempty, 'keep'), 'utf8'), 'retain');
});

test('failed extraction removes its staging tree instead of exposing partial sources', async (t) => {
	const { root, archivePath, api, sha256 } = await setup(t, archive([
		{ name: `${prefix}/packages/workflow/src`, body: 'conflicts with already extracted directory' },
	]));
	const workDir = path.join(root, 'extracted');
	await assert.rejects(api.extractSourceArchive({ archivePath, workDir, commit, sha256 }), /Archive command failed.*during --extract/);
	assert.deepEqual(await fs.readdir(workDir), []);
});
