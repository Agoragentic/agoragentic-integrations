import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { loadVerifiedArchive, extractSourceArchive, extractPackageArchive, inventoryFiles } from './fixture-source.mjs';
import { compileFixtureSources } from './fixture-compiler.mjs';
const { validateAuditReport } = createRequire(import.meta.url)('./audit-dev-dependencies.cjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(root, 'fixtures/zod4-compat');
const buildRoot = path.join(fixtureRoot, 'build');
const manifestPath = path.join(fixtureRoot, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const { values } = parseArgs({ options: { write: { type: 'boolean' }, check: { type: 'boolean' }, 'source-archive': { type: 'string' } } });
if (values.write && values.check) throw new Error('--write cannot be combined with verification');
const hash = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const slash = (value) => value.split(path.sep).join('/');
function inside(base, candidate) {
	const relative = path.relative(path.resolve(base), path.resolve(candidate));
	if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Unsafe owned path: ${candidate}`);
}
function command(executable, args, options = {}) {
	const result = spawnSync(executable, args, { encoding: 'utf8', shell: false, maxBuffer: 32 * 1024 * 1024, timeout: 300000, ...options });
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`${executable} failed (${result.status}): ${result.stderr}\n${result.stdout}`);
	return result.stdout;
}
function npm(args, cwd = buildRoot) {
	const cli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
	return existsSync(cli) ? command(process.execPath, [cli, ...args], { cwd }) : command('npm', args, { cwd });
}
function auditBuild(directory = buildRoot) {
	validateAuditReport(JSON.parse(npm(['audit', '--json', '--prefix', directory], directory)));
}
async function pack(name, work) {
	const expected = manifest.packages[name];
	const [record] = JSON.parse(npm(['pack', `${name}@${expected.version}`, '--ignore-scripts', '--json', '--pack-destination', work]));
	if (!record?.filename || path.basename(record.filename) !== record.filename) throw new Error('Unexpected package archive name');
	return extractPackageArchive({ archivePath: path.join(work, record.filename), workDir: path.join(work, name.replaceAll('/', '__')), integrity: expected.integrity });
}
async function patchSource(sourceRoot, originalRoot, upstream) {
	for (const relative of ['packages/workflow/src', 'packages/@n8n/expression-runtime/src']) {
		await mkdir(path.dirname(path.join(sourceRoot, relative)), { recursive: true });
		await mkdir(path.dirname(path.join(originalRoot, relative)), { recursive: true });
		await cp(path.join(upstream, relative), path.join(sourceRoot, relative), { recursive: true });
		await cp(path.join(upstream, relative), path.join(originalRoot, relative), { recursive: true });
	}
	const changes = [];
	async function patch(relative, pairs, reason) {
		const file = path.join(sourceRoot, relative);
		const before = await readFile(file, 'utf8');
		let after = before;
		for (const [needle, replacement] of pairs) {
			if (typeof needle === 'string' ? !after.includes(needle) : !needle.test(after)) throw new Error(`Pinned source patch missing: ${relative}: ${needle}`);
			after = after.replace(needle, replacement);
		}
		await writeFile(file, after);
		changes.push({ path: relative, before: hash(before), after: hash(after), reason });
	}
	await patch('packages/workflow/src/schemas.ts', [
		['z.record(z.union([z.string(), z.number()]))', 'z.record(z.string(), z.union([z.string(), z.number()]))'],
		['z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))', 'z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))'],
	], 'Explicit Zod 4 record keys preserve value validation');
	await patch('packages/workflow/src/message-event-bus.ts', [['z.record(z.unknown()).optional()', 'z.record(z.string(), z.unknown()).optional()']], 'Preserve optional credential record');
	await patch('packages/@n8n/expression-runtime/src/bridge/bridge-messages.ts', [
		['// `z.unknown()` already accepts `undefined`, so no `.optional()` needed.', '// Zod 4 requires an explicit optional property to preserve omission.'],
		['defaultValue: z.unknown(),', 'defaultValue: z.unknown().optional(),'],
	], 'Preserve omitted fromAi default');
	await patch('packages/workflow/src/from-ai-parse-utils.ts', [
		[/\n\t\t\tinterface CustomSchemaDef[\s\S]*?\n\t\t\t\/\/ Create a custom schema/, '\n\t\t\t// Create a custom schema'],
		[/\n\t\t\t\/\/ Cast the custom schema[\s\S]*?\n\t\t\tschema = typedSchema;/, '\n\t\t\tObject.assign(customSchema._def, { jsonSchema: { anyOf: [{ type: \'object\', minProperties: 1, additionalProperties: true }, { type: \'array\', minItems: 1 }] } });\n\t\t\tschema = customSchema;'],
		['schema = schema.default(placeholder.defaultValue);', 'schema = schema.prefault(placeholder.defaultValue);'],
	], 'Remove obsolete Zod generics; preserve JSON metadata and validation of defaults');
	await patch('packages/workflow/src/workflow-structure-validation.ts', [
		['formatWorkflowStructureIssuePath = (path: Array<string | number>)', 'formatWorkflowStructureIssuePath = (path: ReadonlyArray<PropertyKey>)'],
		['Array<string | number>', 'ReadonlyArray<PropertyKey>'],
		['return acc ? `${acc}.${segment}` : segment;', 'const label = String(segment);\n\t\treturn acc ? `${acc}.${label}` : label;'],
	], 'Handle Zod 4 property keys including symbols');
	await patch('packages/workflow/src/index.ts', [['export type {', "import type { ClientRequest } from 'node:http';\n\nexport type {"]], 'Resolve the upstream HTTP augmentation type explicitly');
	const logSource = await readFile(path.join(upstream, 'packages/@n8n/config/src/configs/logging.config.ts'), 'utf8');
	const scopes = logSource.match(/export const LOG_SCOPES = \[[\s\S]*?\] as const;\s+export type LogScope = \(typeof LOG_SCOPES\)\[number\];/)?.[0];
	if (!scopes) throw new Error('Pinned LogScope source not found');
	const logPath = 'packages/workflow/src/log-scope.ts';
	await writeFile(path.join(sourceRoot, logPath), `${scopes}\n`);
	changes.push({ path: logPath, before: null, after: hash(`${scopes}\n`), reason: 'Verbatim tuple and type from pinned logging.config.ts; no runtime config or Zod 3 dependency' });
	await patch('packages/workflow/src/interfaces.ts', [["import type { LogScope } from '@n8n/config';", "import type { LogScope } from './log-scope';"]], 'Use the exact source-bound logging type');
	return changes;
}

async function build() {
	console.log('Installing the locked fixture toolchain (lifecycle scripts disabled)');
	npm(['ci', '--ignore-scripts', '--install-links', '--prefix', buildRoot]);
	auditBuild();
	const lock = JSON.parse(await readFile(path.join(buildRoot, 'package-lock.json'), 'utf8'));
	const zod = lock.packages['node_modules/zod'];
	if (zod.version !== '4.6.7' || zod.integrity !== manifest.packages.zod.integrity || Object.entries(lock.packages).some(([key, entry]) => key.endsWith('/zod') && entry.version !== '4.6.7')) throw new Error('Unexpected Zod closure');
	const source = await loadVerifiedArchive({ archivePath: values['source-archive'] ?? process.env.N8N_FIXTURE_SOURCE_ARCHIVE, commit: manifest.source_commit, sha256: manifest.source_archive_sha256 });
	const work = await mkdtemp(path.join(buildRoot, '.fixture-'));
	try {
		const upstream = await extractSourceArchive({ archivePath: source.archivePath, workDir: path.join(work, 'upstream'), commit: manifest.source_commit, sha256: manifest.source_archive_sha256 });
		const sourceInventory = await inventoryFiles(upstream);
		for (const [name, relative] of [['n8n-workflow', 'packages/workflow'], ['@n8n/expression-runtime', 'packages/@n8n/expression-runtime']]) {
			const declared = JSON.parse(await readFile(path.join(upstream, relative, 'package.json'), 'utf8'));
			if (declared.name !== name || declared.version !== manifest.packages[name].version) throw new Error(`Pinned source package identity differs: ${name}`);
		}
		for (const pkg of Object.values(manifest.packages)) for (const [relative, digest] of Object.entries(pkg.source_files ?? {})) if (hash(await readFile(path.join(upstream, relative))) !== digest) throw new Error(`Source binding mismatch: ${relative}`);
		const sourceRoot = path.join(work, 'source');
		const changes = await patchSource(sourceRoot, path.join(work, 'original'), upstream);
		const diff = spawnSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.abbrev=7', '-c', 'core.quotePath=true', 'diff', '--no-color', '--no-ext-diff', '--no-textconv', '--src-prefix=a/', '--dst-prefix=b/', '--no-index', '--', 'original', 'source'], { cwd: work, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
		if (diff.error || diff.status !== 1) throw new Error(`Source patch generation failed: ${diff.stderr}`);
		const sourcePatch = diff.stdout;
		const inputFiles = ['scripts/build-zod4-fixture.mjs', 'scripts/fixture-source.mjs', 'scripts/fixture-compiler.mjs', 'scripts/check-zod4-consumer.mjs', 'scripts/audit-dev-dependencies.cjs', 'fixtures/zod4-compat/build/package.json', 'fixtures/zod4-compat/build/package-lock.json', 'fixtures/zod4-compat/build/consumer-check/public-exports.mts', 'fixtures/zod4-compat/build/consumer-check/public-exports.cts'];
		const inputs = { archive: manifest.source_archive_sha256, source_inventory: hash(json(sourceInventory)), source_patch: hash(sourcePatch), files: [] };
		for (const relative of inputFiles) inputs.files.push({ path: relative, sha256: hash(await readFile(path.join(root, relative))) });
		const inputHash = hash(json(inputs));
		console.log('Compiling all workflow and expression sources and declarations');
		const compiled = await compileFixtureSources({ sourceRoot, outputRoot: path.join(work, 'compiled'), toolchainRoot: buildRoot });
		const generated = path.join(work, 'packages');
		for (const [name, folder, sourceFolder] of [['n8n-workflow', 'n8n-workflow', 'workflow'], ['@n8n/expression-runtime', 'expression-runtime', '@n8n/expression-runtime']]) {
			const registryRoot = await pack(name, work);
			const metadata = JSON.parse(await readFile(path.join(registryRoot, 'package.json'), 'utf8'));
			if (metadata.name !== name || metadata.version !== manifest.packages[name].version) throw new Error('Unexpected registry metadata');
			metadata.type = 'module'; metadata.private = true;
			delete metadata.scripts; delete metadata.devDependencies;
			metadata.xAgoragenticFixture = { upstreamVersion: metadata.version, upstreamSourceCommit: manifest.source_commit, zodVersion: '4.6.7', buildInputs: inputHash };
			if (name === 'n8n-workflow') metadata.peerDependencies = { ...metadata.peerDependencies, zod: '4.6.7' };
			else metadata.dependencies = { ...metadata.dependencies, zod: '4.6.7' };
			const destination = path.join(generated, folder);
			await mkdir(destination, { recursive: true });
			await writeFile(path.join(destination, 'package.json'), json(metadata));
			for (const format of ['esm', 'cjs']) {
				await cp(path.join(compiled[format], sourceFolder, 'src'), path.join(destination, 'dist', format), { recursive: true });
				await writeFile(path.join(destination, 'dist', format, 'package.json'), json({ type: format === 'esm' ? 'module' : 'commonjs' }));
			}
			for (const license of ['LICENSE.md', 'LICENSE_EE.md']) await cp(path.join(upstream, license), path.join(destination, license));
			await writeFile(path.join(destination, 'NOTICE.md'), `Development-only modified fixture of ${name}@${metadata.version}. Source commit ${manifest.source_commit}. Built by Agoragentic with the changes in ../../source-changes.patch; not an upstream release. Upstream licenses apply.\n`);
			if (name === '@n8n/expression-runtime') {
				const architecture = await readFile(path.join(upstream, 'packages/@n8n/expression-runtime/ARCHITECTURE.md'), 'utf8');
				if (!architecture.includes('[n8n workflow package](../workflow/)')) throw new Error('Upstream architecture link changed');
				await writeFile(path.join(destination, 'ARCHITECTURE.md'), '> Upstream architecture reference; native execution is not qualified by this development fixture. The sibling workflow link is adjusted for this fixture layout.\n\n' + architecture.replace('[n8n workflow package](../workflow/)', '[n8n workflow package](../n8n-workflow/)'));
			}
		}
		const esbuild = await import(pathToFileURL(path.join(buildRoot, 'node_modules/esbuild/lib/main.js')));
		if (esbuild.version !== '0.25.9') throw new Error('Unexpected bundler version');
		const bundleInputs = {};
		for (const format of ['iife', 'esm']) {
			const bundle = await esbuild.build({ absWorkingDir: work, entryPoints: ['source/packages/@n8n/expression-runtime/src/runtime/index.ts'], outfile: path.join(generated, 'expression-runtime/dist/bundle', `runtime.${format}.js`), bundle: true, minify: true, sourcemap: true, target: 'es2020', platform: 'neutral', mainFields: ['module', 'main'], external: [], format, ...(format === 'iife' ? { globalName: '__n8nRuntime' } : {}), metafile: true });
			bundleInputs[format] = [];
			for (const relative of Object.keys(bundle.metafile.inputs).sort()) {
				const absolute = path.resolve(work, relative);
				const sourceRelative = path.relative(sourceRoot, absolute);
				let label;
				if (!sourceRelative.startsWith('..') && !path.isAbsolute(sourceRelative)) label = `source/${slash(sourceRelative)}`;
				else { inside(path.join(buildRoot, 'node_modules'), absolute); label = `dependency/${slash(path.relative(path.join(buildRoot, 'node_modules'), absolute))}`; }
				bundleInputs[format].push({ path: label, sha256: hash(await readFile(absolute)) });
			}
		}
		// Text-only generated artifacts have stable bytes on Windows and Linux.
		for (const entry of await inventoryFiles(generated)) {
			const file = path.join(generated, entry.path); const bytes = await readFile(file);
			const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
			if (text.includes('\0')) throw new Error('Unexpected binary fixture output');
			await writeFile(file, text.replaceAll('\r\n', '\n'));
		}
		const inventory = await inventoryFiles(generated);
		const evidence = { 'source-inventory.json': json(sourceInventory), 'source-changes.patch': sourcePatch, 'build-inputs.json': json(inputs), 'bundle-inputs.json': json(bundleInputs), 'artifact-inventory.json': json({ schema: manifest.schema, source_commit: manifest.source_commit, compiler: compiled.compilerVersion, packages: inventory }) };
		const consumerRoot = path.join(work, 'consumer/build');
		await mkdir(consumerRoot, { recursive: true });
		await cp(generated, path.join(work, 'consumer/packages'), { recursive: true });
		for (const name of ['package.json', 'package-lock.json', 'consumer-check']) await cp(path.join(buildRoot, name), path.join(consumerRoot, name), { recursive: true });
		npm(['ci', '--ignore-scripts', '--install-links', '--prefix', consumerRoot], consumerRoot); auditBuild(consumerRoot);
		command(process.execPath, [path.join(root, 'scripts/check-zod4-consumer.mjs'), '--build-root', consumerRoot]);
		if (values.write) {
			const target = path.join(fixtureRoot, 'packages'); inside(fixtureRoot, target);
			await rm(target, { recursive: true, force: true }); await cp(generated, target, { recursive: true });
			manifest.compiler = { typescript: compiled.compilerVersion, skipLibCheck: false, declaration_test_skipLibCheck: false, newline: 'LF' };
			manifest.build_toolchain.lockfile_sha256 = hash(await readFile(path.join(buildRoot, 'package-lock.json')));
			manifest.build_toolchain.audit = 'Zero vulnerabilities at all severities';
			manifest.patches = changes; manifest.build_inputs_sha256 = inputHash;
			manifest.evidence = Object.fromEntries(Object.entries(evidence).map(([name, bytes]) => [name, hash(bytes)]));
			manifest.artifact_inventory_sha256 = manifest.evidence['artifact-inventory.json'];
			for (const [name, bytes] of Object.entries(evidence)) await writeFile(path.join(fixtureRoot, name), bytes);
			await writeFile(manifestPath, json(manifest));
		} else {
			if (json(manifest.patches) !== json(changes) || manifest.compiler.typescript !== compiled.compilerVersion || manifest.compiler.skipLibCheck !== false || manifest.compiler.declaration_test_skipLibCheck !== false || manifest.build_toolchain.lockfile_sha256 !== hash(await readFile(path.join(buildRoot, 'package-lock.json')))) throw new Error('Recorded source/compiler metadata differs from verified build');
			if (JSON.stringify(await inventoryFiles(path.join(fixtureRoot, 'packages'))) !== JSON.stringify(inventory)) throw new Error('Regenerated artifacts differ from committed fixture');
			if (inputHash !== manifest.build_inputs_sha256) throw new Error('Build inputs changed');
			for (const [name, bytes] of Object.entries(evidence)) if (hash(bytes) !== manifest.evidence?.[name] || (await readFile(path.join(fixtureRoot, name), 'utf8')) !== bytes) throw new Error(`Reproduction evidence differs: ${name}`);
		}
		console.log(json({ written: Boolean(values.write), source_commit: manifest.source_commit, source_files: sourceInventory.length, artifact_files: inventory.length, build_inputs: inputHash, strict_installed_consumers: 'passed' }));
	} finally { inside(buildRoot, work); await rm(work, { recursive: true, force: true }); await source.cleanup(); }
}
await build();
