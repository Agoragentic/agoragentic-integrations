'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { syncBuiltinESMExports } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const source = path.join(root, 'fixtures/lint-parser');
const verifier = () => import('../scripts/verify-lint-parser.mjs');

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

test('lint parser preserves upstream artifacts and all installed consumer bindings', async () => {
	const { verifyFixture, verifyInstalled } = await verifier();
	assert.equal(verifyFixture().unchanged_artifact_files, 90);
	assert.deepEqual(verifyInstalled(), { consumers: 4, minimatch: '11.0.8' });
	const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
	assert.match(pkg.scripts.check, /^npm run check:lint-parser && npm run check:fixture &&/);
	assert.equal(pkg.files.includes('fixtures'), false);
});

test('lint parser rejects changed, missing and extra artifacts and manifest substitutions', async t => {
	const { verifyFixture } = await verifier();
	const mutations = {
		'changed artifact': directory => fs.appendFileSync(path.join(directory, 'package/dist/index.js'), '\n// tampered\n'),
		'missing artifact': directory => fs.unlinkSync(path.join(directory, 'package/LICENSE')),
		'extra artifact': directory => fs.writeFileSync(path.join(directory, 'package/unreviewed.js'), 'export {};\n'),
		'changed dependency': directory => {
			const file = path.join(directory, 'package/package.json');
			const pkg = JSON.parse(fs.readFileSync(file));
			pkg.dependencies.minimatch = '^10.2.2';
			fs.writeFileSync(file, JSON.stringify(pkg));
		},
		'added install script': directory => {
			const file = path.join(directory, 'package/package.json');
			const pkg = JSON.parse(fs.readFileSync(file));
			pkg.scripts = { install: 'echo forbidden' };
			fs.writeFileSync(file, JSON.stringify(pkg));
		},
		'false upstream attribution': directory => {
			const file = path.join(directory, 'manifest.json');
			const manifest = JSON.parse(fs.readFileSync(file));
			manifest.upstream_fix_commit = '0'.repeat(40);
			fs.writeFileSync(file, JSON.stringify(manifest));
		},
	};
	for (const [name, mutate] of Object.entries(mutations)) {
		await t.test(name, () => {
			const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-lint-parser-'));
			try {
				fs.cpSync(source, directory, { recursive: true, filter: file => path.basename(file) !== 'node_modules' });
				mutate(directory);
				assert.throws(() => verifyFixture(directory));
			} finally {
				fs.rmSync(directory, { recursive: true, force: true });
			}
		});
	}
});

test('the patched parser retains n8n safety lint and TypeScript diagnostics', async () => {
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
