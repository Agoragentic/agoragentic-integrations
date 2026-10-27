import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePackages = ['workflow', '@n8n/expression-runtime'];
const extensionlessBarePackages = ['lodash/', 'recast/', 'ast-types/'];

const asAbsolute = (value) => path.resolve(value);
const isInside = (root, candidate) => {
	const relative = path.relative(root, candidate);
	return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

function sourceFiles(ts, sourceRoot) {
	const files = [];
	for (const packageName of sourcePackages) {
		const directory = path.join(sourceRoot, 'packages', packageName, 'src');
		for (const file of ts.sys.readDirectory(directory, ['.ts'], undefined, undefined)) {
			const normalized = file.split(path.sep).join('/');
			if (!normalized.includes('/__tests__/') && !normalized.endsWith('.test.ts')) files.push(file);
		}
	}
	return files.sort();
}

function resolveRelative(ts, baseDirectory, specifier) {
	const raw = specifier.endsWith('.js') ? specifier.slice(0, -3) : specifier;
	for (const extension of ['.ts', '.tsx', '.d.ts', '.js']) {
		if (ts.sys.fileExists(path.resolve(baseDirectory, `${raw}${extension}`))) return `${raw}.js`;
	}
	for (const extension of ['.ts', '.tsx', '.d.ts', '.js']) {
		if (ts.sys.fileExists(path.resolve(baseDirectory, raw, `index${extension}`))) return `${raw}/index.js`;
	}
	if (path.extname(raw) && ts.sys.fileExists(path.resolve(baseDirectory, raw))) return raw;
	throw new Error(`Unresolved relative fixture import '${specifier}' from ${baseDirectory}`);
}

function rewriteSpecifier(ts, factory, sourceFile, specifier, outputRoot, rootDirectory) {
	if (specifier.startsWith('.')) {
		const sourceDirectory = isInside(outputRoot, sourceFile.fileName)
			? path.dirname(path.join(rootDirectory, path.relative(outputRoot, sourceFile.fileName)))
			: path.dirname(sourceFile.fileName);
		return resolveRelative(ts, sourceDirectory, specifier);
	}
	for (const prefix of extensionlessBarePackages) {
		if (specifier.startsWith(prefix) && !path.extname(specifier)) return `${specifier}.js`;
	}
	return specifier;
}

function createSpecifierTransformer(ts, factory, outputRoot, rootDirectory) {
	return (context) => {
		const visit = (sourceFile) => {
			const rewrite = (literal) => factory.createStringLiteral(
				rewriteSpecifier(ts, factory, sourceFile, literal.text, outputRoot, rootDirectory),
			);
			const visitor = (node) => {
				if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
					return factory.updateImportDeclaration(node, node.modifiers, node.importClause, rewrite(node.moduleSpecifier), node.attributes);
				}
				if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
					return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, rewrite(node.moduleSpecifier), node.attributes);
				}
				if (ts.isImportTypeNode(node)) {
					const argument = ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)
						? factory.updateLiteralTypeNode(node.argument, rewrite(node.argument.literal))
						: node.argument;
					return factory.updateImportTypeNode(node, argument, node.attributes, node.qualifier, node.typeArguments, node.isTypeOf);
				}
				if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length > 0) {
					const argument = node.arguments[0];
					if (ts.isStringLiteral(argument)) return factory.updateCallExpression(node, node.expression, node.typeArguments, [rewrite(argument), ...node.arguments.slice(1)]);
				}
				return ts.visitEachChild(node, visitor, context);
			};
			return ts.visitNode(sourceFile, visitor);
		};
		return (node) => visit(node);
	};
}

async function loadTypeScript(toolchainRoot) {
	const root = asAbsolute(toolchainRoot);
	const packagePath = path.join(root, 'node_modules', 'typescript', 'package.json');
	const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
	if (packageJson.version !== '5.9.2') throw new Error('The fixture compiler must be TypeScript 5.9.2');
	const modulePath = path.join(root, 'node_modules', 'typescript', 'lib', 'typescript.js');
	const module = await import(pathToFileURL(modulePath));
	return { ts: module.default ?? module, version: packageJson.version };
}

export async function compileFixtureSources({ sourceRoot, outputRoot, toolchainRoot }) {
	const root = asAbsolute(sourceRoot);
	const out = asAbsolute(outputRoot);
	const toolchain = asAbsolute(toolchainRoot);
	const { ts, version: compilerVersion } = await loadTypeScript(toolchain);
	const rootDirectory = path.join(root, 'packages');
	const roots = sourceFiles(ts, root);
	if (!roots.length) throw new Error('No fixture TypeScript sources were found');
	const results = {};
	for (const [name, moduleKind, moduleResolution] of [
		['esm', ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler],
		['cjs', ts.ModuleKind.CommonJS, ts.ModuleResolutionKind.NodeJs],
	]) {
		const destination = path.join(out, name);
		const commonOptions = {
			allowJs: false,
			baseUrl: root,
			declaration: true,
			declarationMap: true,
			esModuleInterop: true,
			forceConsistentCasingInFileNames: true,
			newLine: ts.NewLineKind.LineFeed,
			noEmitOnError: true,
			outDir: destination,
			rootDir: rootDirectory,
			paths: { '@n8n/expression-runtime': ['packages/@n8n/expression-runtime/src/index.ts'] },
			skipLibCheck: false,
			sourceMap: true,
			strict: true,
			target: ts.ScriptTarget.ES2022,
			types: ['node'],
			typeRoots: [path.join(toolchain, 'node_modules', '@types')],
		};
		// Type checking always uses modern package-boundary resolution. NodeJs
		// resolution is retained only for the CommonJS emitter because the
		// compiler rejects module=CommonJS with moduleResolution=Bundler.
		const semanticOptions = {
			...commonOptions,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			noEmit: true,
		};
		const semanticProgram = ts.createProgram(roots, semanticOptions);
		const diagnostics = ts.getPreEmitDiagnostics(semanticProgram);
		if (diagnostics.length) {
			const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
				getCanonicalFileName: (fileName) => fileName,
				getCurrentDirectory: () => root,
				getNewLine: () => '\n',
			});
			throw new Error(`Fixture ${name} typecheck failed:\n${message}`);
		}
		const options = {
			...commonOptions,
			module: moduleKind,
			moduleResolution,
			// CJS emission uses NodeJs resolution for the supported CommonJS
			// emitter, while source/declaration semantics were already checked
			// above with Bundler resolution.
			noEmitOnError: name !== 'cjs',
		};
		const program = ts.createProgram(roots, options);
		const emitDiagnostics = [
			...program.getOptionsDiagnostics(),
			...program.getSyntacticDiagnostics(),
		];
		if (emitDiagnostics.length) {
			const message = ts.formatDiagnosticsWithColorAndContext(emitDiagnostics, {
				getCanonicalFileName: (fileName) => fileName,
				getCurrentDirectory: () => root,
				getNewLine: () => '\n',
			});
			throw new Error(`Fixture ${name} emit setup failed:\n${message}`);
		}
		const transformer = createSpecifierTransformer(ts, ts.factory, destination, rootDirectory);
		const emitted = program.emit(undefined, undefined, undefined, false, {
			before: [transformer],
			afterDeclarations: [transformer],
		});
		if (emitted.emitSkipped || emitted.diagnostics.length) {
			const message = ts.formatDiagnosticsWithColorAndContext(emitted.diagnostics, {
				getCanonicalFileName: (fileName) => fileName,
				getCurrentDirectory: () => root,
				getNewLine: () => '\n',
			});
			throw new Error(`Fixture ${name} emit failed:\n${message}`);
		}
		results[name] = destination;
	}
	return { ...results, compilerVersion };
}
