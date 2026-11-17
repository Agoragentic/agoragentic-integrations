'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { syncBuiltinESMExports } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const verifier = () => import('../scripts/verify-lint-parser.mjs');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name)));

test('parser file reads bind metadata and bytes to one descriptor and refuse replacements', async t => {
	const { readPlainFile } = await verifier();
	for (const phase of ['after open', 'before read', 'during read']) {
		await t.test(phase, () => {
			const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-parser-race-'));
			const file = path.join(directory, 'artifact');
			fs.writeFileSync(file, 'original artifact');
			const open = fs.openSync;
			const read = fs.readFileSync;
			let descriptor;
			let changed = false;
			const replace = () => {
				changed = true;
				fs.renameSync(file, path.join(directory, 'original'));
				fs.writeFileSync(file, 'replacement artifact');
			};
			try {
				fs.openSync = (...args) => {
					const result = open(...args);
					if (args[0] === file && !changed) {
						descriptor = result;
						if (phase === 'after open') replace();
					}
					return result;
				};
				fs.readFileSync = (...args) => {
					if (args[0] === descriptor && !changed) {
						if (phase === 'before read') replace();
						if (phase === 'during read') {
							changed = true;
							fs.writeFileSync(file, 'modified descriptor contents with a different size');
						}
					}
					return read(...args);
				};
				syncBuiltinESMExports();
				assert.throws(() => readPlainFile(file), /File changed while verifying/);
				assert.ok(changed, 'the actual filesystem mutation must run');
				assert.throws(() => fs.fstatSync(descriptor), { code: 'EBADF' });
			} finally {
				fs.openSync = open;
				fs.readFileSync = read;
				syncBuiltinESMExports();
				fs.rmSync(directory, { recursive: true, force: true });
			}
		});
	}
});

test('parser file reads reject non-files and symlinks', async t => {
	const { readPlainFile } = await verifier();
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-parser-kind-'));
	try {
		assert.throws(() => readPlainFile(directory));
		const target = path.join(directory, 'target');
		fs.writeFileSync(target, 'fixture');
		assert.equal(readPlainFile(target).toString(), 'fixture');
		await t.test('symlink refusal', t => {
			const link = path.join(directory, 'link');
			try {
				fs.symlinkSync(target, link, 'file');
			} catch (error) {
				if (process.platform === 'win32' && error.code === 'EPERM') {
					t.skip('Windows account cannot create file symlinks');
					return;
				}
				throw error;
			}
			assert.throws(() => readPlainFile(link));
		});
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});

test('the locked upstream parser is used by every installed lint consumer', async () => {
	const { verifyInstalled } = await verifier();
	assert.deepEqual(verifyInstalled(), { parser: '8.73.0', consumers: 4, minimatch: '11.0.8' });
	const pkg = readJson('package.json');
	assert.match(pkg.scripts.check, /^npm run check:lint-parser && npm run check:fixture &&/);
	assert.equal(pkg.files.includes('fixtures'), false);
});

test('lint parser rejects unsafe dependency resolutions', async t => {
	const { verifyParserLock } = await verifier();
	const parser = 'node_modules/@typescript-eslint/typescript-estree';
	const mutations = {
		'linked parser': (_pkg, lock) => { lock.packages[parser].link = true; },
		'missing integrity': (_pkg, lock) => { delete lock.packages[parser].integrity; },
		'replaced archive origin': (_pkg, lock) => { lock.packages[parser].resolved = 'file:parser.tgz'; },
		'nested parser': (_pkg, lock) => { lock.packages[`node_modules/private-lint/${parser}`] = lock.packages[parser]; },
		'affected minimatch': (_pkg, lock) => { lock.packages['node_modules/minimatch'].version = '10.2.6'; },
		'added override': pkg => { pkg.overrides = { minimatch: '11.0.8' }; },
	};
	for (const [name, mutate] of Object.entries(mutations)) {
		await t.test(name, () => {
			const pkg = readJson('package.json');
			const lock = readJson('package-lock.json');
			mutate(pkg, lock);
			assert.throws(() => verifyParserLock(pkg, lock), { code: 'ERR_ASSERTION' });
		});
	}
});

test('the upstream parser retains n8n safety lint and TypeScript diagnostics', async () => {
	const { ESLint } = await import('eslint');
	const eslint = new ESLint({ cwd: root });
	const filePath = path.join(root, 'nodes/Agoragentic/Agoragentic.node.ts');
	const cases = [
		{ code: "eval('1 + 1');", suffix: '/no-dangerous-functions' },
		{ code: "import { exec as run } from 'node:child_process'; run('synthetic-command');", suffix: '/no-dangerous-functions' },
		{ code: "const apiKey = 'sYnThEtIc9aBcDeF0123456789';", suffix: '/no-hardcoded-secrets' },
		{ code: 'const value: any = 1;', suffix: '/no-explicit-any' },
	];
	for (const fixture of cases) {
		const [result] = await eslint.lintText(fixture.code, { filePath });
		assert.ok(result.messages.some(message => message.ruleId?.endsWith(fixture.suffix)), fixture.suffix);
	}
	const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
	pkg.overrides = { minimatch: '11.0.8' };
	const [result] = await eslint.lintText(JSON.stringify(pkg, null, 2), { filePath: path.join(root, 'package.json') });
	assert.ok(result.messages.some(message => message.ruleId?.endsWith('/no-overrides-field')));
});

test('project service keeps its minimatch default-project allowlist boundary', () => {
	const parser = require('@typescript-eslint/typescript-estree');
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-lint-project-'));
	const code = 'const value: number = 1;';
	try {
		fs.mkdirSync(path.join(directory, 'src'));
		fs.writeFileSync(path.join(directory, 'src/index.ts'), 'export {};');
		fs.writeFileSync(path.join(directory, 'tsconfig.json'), JSON.stringify({ include: ['src/**/*.ts'] }));
		for (const name of ['allowed.ts', 'blocked.ts']) fs.writeFileSync(path.join(directory, name), code);
		const options = {
			tsconfigRootDir: directory,
			projectService: { allowDefaultProject: ['allowed.ts'] },
		};
		const result = parser.parseAndGenerateServices(code, { ...options, filePath: path.join(directory, 'allowed.ts') });
		assert.equal(result.ast.type, 'Program');
		assert.ok(result.services.program);
		assert.throws(() => parser.parseAndGenerateServices(code, {
			...options, filePath: path.join(directory, 'blocked.ts'),
		}), /not found by the project service/);
	} finally {
		parser.clearCaches();
		fs.rmSync(directory, { recursive: true, force: true });
	}
});
