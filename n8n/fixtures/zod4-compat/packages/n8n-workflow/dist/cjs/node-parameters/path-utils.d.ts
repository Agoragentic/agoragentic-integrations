/**
 * Resolve relative paths starting in & in the context of a given full path including parameters,
 * which will be dropped in the process.
 * If `candidateRelativePath` is not relative, it is returned unchanged.
 *
 * `parameters.a.b.c`, `&d` -> `a.b.d`
 * `parameters.a.b[0].c`, `&d` -> `a.b[0].d`
 * `parameters.a.b.c`, `d` -> `d`
 */
export declare function resolveRelativePath(fullPathWithParameters: string, candidateRelativePath: string): string;
//# sourceMappingURL=path-utils.d.ts.map