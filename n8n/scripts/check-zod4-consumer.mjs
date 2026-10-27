import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { 'build-root': { type: 'string' } } });
const buildRoot = values['build-root'] ? path.resolve(values['build-root']) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'zod4-compat', 'build');
const typescriptRoot = path.join(buildRoot, 'node_modules', 'typescript');
const typescriptLib = path.join(typescriptRoot, 'lib', 'typescript.js');
const tsc = path.join(typescriptRoot, 'bin', 'tsc');
if (!existsSync(typescriptLib) || !existsSync(tsc)) throw new Error(`strict public consumer declaration check requires the dedicated compiler at ${typescriptLib}`);
const compilerVersion = JSON.parse(readFileSync(path.join(typescriptRoot, 'package.json'), 'utf8')).version;
if (compilerVersion !== '5.9.2') throw new Error(`strict public consumer declaration check requires TypeScript 5.9.2, found ${compilerVersion}`);
const common = ['--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--strict', '--skipLibCheck', 'false', '--noEmit', '--types', 'node'];
for (const input of ['consumer-check/public-exports.mts', 'consumer-check/public-exports.cts']) {
	const result = spawnSync(process.execPath, [tsc, ...common, input], { cwd: buildRoot, encoding: 'utf8', shell: false });
	if (result.status !== 0) throw new Error(`strict public consumer declaration check failed for ${input}:\n${result.stderr || result.stdout}`);
}
console.log('Strict public CJS/ESM consumer declaration checks passed with skipLibCheck=false.');
