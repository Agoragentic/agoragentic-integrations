import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const maximumArchiveBytes = 128 * 1024 * 1024;
const sourceSelections = [
	'packages/workflow',
	'packages/@n8n/expression-runtime',
	'packages/@n8n/typescript-config',
	'packages/@n8n/config/src/configs/logging.config.ts',
	'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'tsconfig.json',
	'LICENSE.md', 'LICENSE_EE.md',
];

export const sha256Bytes = (bytes) => createHash('sha256').update(bytes).digest('hex');

function expectedHash(value) {
	const digest = value.replace(/^sha256:/, '');
	if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('A lowercase SHA-256 archive digest is required');
	return digest;
}

function checkedCommit(value) {
	if (!/^[a-f0-9]{40}$/.test(value)) throw new Error('A full lowercase upstream commit is required');
	return value;
}

function contained(root, candidate) {
	const relative = path.relative(root, candidate);
	if (relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) return;
	throw new Error(`Path escapes the selected source directory: ${candidate}`);
}

let tarPrefix;
function tar(args) {
	if (!tarPrefix) {
		const version = spawnSync('tar', ['--version'], { encoding: 'utf8', shell: false });
		if (version.error) throw version.error;
		if (version.status !== 0) throw new Error('Could not identify the archive tool');
		if (/GNU tar/.test(version.stdout)) tarPrefix = ['--force-local'];
		else if (/bsdtar/.test(version.stdout)) tarPrefix = [];
		else throw new Error('Source extraction requires GNU tar or bsdtar');
	}
	// GNU tar otherwise treats a Windows drive letter as a remote archive host.
	const portableArgs = process.platform === 'win32' && tarPrefix.length
		? args.map((arg) => /^[A-Za-z]:[\\/]/.test(arg) ? arg.replaceAll('\\', '/') : arg)
		: args;
	const result = spawnSync('tar', [...tarPrefix, ...portableArgs], { encoding: 'utf8', shell: false, maxBuffer: 64 * 1024 * 1024 });
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`Archive command failed (${result.status}) during ${args[0]}: ${result.stderr || result.stdout}`);
	return result.stdout;
}

// Always use an owned copy: verification and extraction never depend on an
// external cache path staying unchanged between separate commands.
export async function loadVerifiedArchive({ archivePath, commit, sha256 }) {
	checkedCommit(commit);
	const digest = expectedHash(sha256);
	let bytes;
	if (archivePath) {
		const info = await lstat(archivePath);
		if (!info.isFile() || info.size > maximumArchiveBytes) throw new Error('Source cache must be a bounded regular archive file');
		bytes = await readFile(archivePath);
	} else {
		const response = await fetch(`https://codeload.github.com/n8n-io/n8n/tar.gz/${commit}`, {
			redirect: 'error', signal: AbortSignal.timeout(120000),
		});
		if (!response.ok || !response.body) throw new Error(`Pinned source download failed: HTTP ${response.status}`);
		if (Number(response.headers.get('content-length')) > maximumArchiveBytes) throw new Error('Source archive exceeds download limit');
		const chunks = [];
		let size = 0;
		const reader = response.body.getReader();
		try {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > maximumArchiveBytes) throw new Error('Source archive exceeds download limit');
				chunks.push(value);
			}
		} finally {
			await reader.cancel();
		}
		bytes = Buffer.concat(chunks);
	}
	if (bytes.length > maximumArchiveBytes || sha256Bytes(bytes) !== digest) throw new Error('Source archive SHA-256 mismatch');
	const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'agoragentic-n8n-source-'));
	const ownedArchive = path.join(temporaryRoot, 'source.tar.gz');
	try {
		await writeFile(ownedArchive, bytes, { flag: 'wx', mode: 0o600 });
	} catch (error) {
		contained(path.resolve(os.tmpdir()), path.resolve(temporaryRoot));
		await rm(temporaryRoot, { recursive: true, force: true });
		throw error;
	}
	return {
		archivePath: ownedArchive,
		async cleanup() {
			contained(path.resolve(os.tmpdir()), path.resolve(temporaryRoot));
			if (!path.basename(temporaryRoot).startsWith('agoragentic-n8n-source-')) throw new Error('Unexpected temporary source root');
			await rm(temporaryRoot, { recursive: true, force: true });
		},
	};
}

export async function extractSourceArchive({ archivePath, workDir, commit, sha256 }) {
	const archiveRoot = `n8n-${checkedCommit(commit)}`;
	if (sha256Bytes(await readFile(archivePath)) !== expectedHash(sha256)) throw new Error('Source archive SHA-256 mismatch');
	return extractTree(archivePath, workDir, archiveRoot, sourceSelections.map((entry) => `${archiveRoot}/${entry}`));
}

export async function extractPackageArchive({ archivePath, workDir, integrity }) {
	const info = await lstat(archivePath);
	if (!info.isFile() || info.size > maximumArchiveBytes) throw new Error('Package archive must be a bounded regular file');
	const bytes = await readFile(archivePath);
	const actual = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
	if (actual !== integrity) throw new Error('Package archive SHA-512 mismatch');
	return extractTree(archivePath, workDir, 'package', ['package']);
}

async function extractTree(archivePath, workDir, archiveRoot, selected) {
	const destination = path.resolve(workDir);
	await mkdir(destination, { recursive: true });
	const info = await lstat(destination);
	if (!info.isDirectory() || info.isSymbolicLink() || (await readdir(destination)).length !== 0) throw new Error('Source extraction requires an empty regular directory');
	const realDestination = await realpath(destination);
	const entries = tar(['--list', '--gzip', '--file', archivePath]).split(/\r?\n/).filter(Boolean).map((entry) => entry.replace(/\/$/, ''));
	for (const entry of entries) {
		if (entry.includes('\\') || entry.includes('\0') || entry.includes(':') || entry.split('/').some((part) => part === '..' || part === '.')) throw new Error(`Unsafe archive entry: ${entry}`);
		if (entry !== archiveRoot && !entry.startsWith(`${archiveRoot}/`)) throw new Error(`Unexpected archive root: ${entry}`);
	}
	for (const selection of selected) {
		if (!entries.some((entry) => entry === selection || entry.startsWith(`${selection}/`))) throw new Error(`Missing required upstream source: ${selection}`);
	}
	for (const line of tar(['--list', '--verbose', '--gzip', '--file', archivePath]).split(/\r?\n/)) {
		// Both GNU tar and bsdtar mark links in the first mode column. Ignore
		// unrelated upstream links (for example .claude); never extract them.
		const beforeTarget = line.split(/ -> | link to /)[0];
		if (!selected.some((selection) => beforeTarget.includes(selection))) continue;
		if (/^[lh]/.test(line)) throw new Error('Links are not allowed in selected source inputs');
		if (!/^[-d]/.test(line)) throw new Error('Unsupported archive entry type in selected source inputs');
	}
	const sourceRoot = path.join(realDestination, archiveRoot);
	contained(realDestination, sourceRoot);
	const staging = await mkdtemp(path.join(realDestination, '.source-extract-'));
	contained(realDestination, staging);
	try {
		tar(['--extract', '--gzip', '--file', archivePath, '--directory', staging, '--no-same-owner', '--', ...selected]);
		const stagedSource = path.join(staging, archiveRoot);
		contained(staging, stagedSource);
		await inventoryFiles(stagedSource);
		// Publish the complete verified tree only after extraction succeeds.
		contained(realDestination, stagedSource);
		contained(realDestination, sourceRoot);
		await rename(stagedSource, sourceRoot);
		return sourceRoot;
	} finally {
		contained(realDestination, staging);
		await rm(staging, { recursive: true, force: true });
	}
}

export async function inventoryFiles(directory) {
	const directoryInfo = await lstat(directory);
	if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) throw new Error('Inventory requires a regular directory');
	const root = await realpath(directory);
	const files = [];
	async function walk(current) {
		contained(root, path.resolve(current));
		const info = await lstat(current);
		if (info.isSymbolicLink()) throw new Error(`Symlink is not a source/artifact file: ${current}`);
		if (info.isDirectory()) {
			for (const name of (await readdir(current)).sort()) await walk(path.join(current, name));
		} else if (info.isFile()) {
			const bytes = await readFile(current);
			files.push({ path: path.relative(root, current).split(path.sep).join('/'), bytes: bytes.length, sha256: sha256Bytes(bytes) });
		} else {
			throw new Error(`Unsupported source/artifact entry: ${current}`);
		}
	}
	await walk(root);
	return files;
}
