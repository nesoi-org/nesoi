import * as path from 'path';
import * as ts from 'typescript';
import { Log } from '~/engine/util/log';

export function makeReplaceImportTransformer(spacePath: string, buildPath: string, paths: Record<string, string | { __remove: boolean }>) {
    
    // @ts-expect-error This is according to documentation, but the type is broken for some reason
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {

        // For some reason the .getSourceFile() sometimes fail, returning undefined
        let fileName: string | undefined;

        const visit: ts.Visitor = (node) => {
            if (node.kind === ts.SyntaxKind.SourceFile) {
                fileName = (node as ts.SourceFile).fileName;
            }
            if (ts.isImportDeclaration(node)) {
                fileName = fileName || node.getSourceFile().fileName;

                const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
                
                const isRelative = importPath.startsWith('./') || importPath.startsWith('../');
                const isAbsolute = importPath.startsWith('/');
                let targetPath;
                // Relative import, search as the absolute path
                if (isRelative) {
                    targetPath = path.resolve(path.dirname(fileName), importPath+'.ts')
                }
                // Not a relative import, search as it is
                else {
                    targetPath = importPath;
                }
                
                let resolvedTargetPath;
                for (const p in paths) {
                    const pt = paths[p];
                    let match = false;
                    if (isAbsolute || isRelative) {
                        match = targetPath.startsWith(p);
                    }
                    else {
                        match = targetPath.split('/')[0] === p;
                    }
                    if (match) {
                        if (typeof pt === 'string') {
                            resolvedTargetPath = targetPath.replace(p, pt)
                        }
                        else if (pt.__remove) {
                            resolvedTargetPath = { __remove: true };
                        }
                        break;
                    }
                }
                if (!resolvedTargetPath) {
                    if (!isRelative && !isAbsolute) {
                        return node;
                    }
                    resolvedTargetPath = targetPath.replace(spacePath, buildPath)
                }
                if (typeof resolvedTargetPath !== 'string') {
                    const importName = node.importClause?.name?.escapedText;
                    Log.debug('compiler', 'trf.replace_import', `Removing import '${importName}' and replacing with a {}`)
                    return ts.factory.createBlock([])
                }
                resolvedTargetPath = resolvedTargetPath.replace(/\.ts$/, '')

                const sourcePath = fileName;
                const resolvedSourcePath = paths[sourcePath]
                const sourceBuildPath = (resolvedSourcePath && typeof resolvedSourcePath === 'string')
                    ? path.dirname(resolvedSourcePath)
                    : path.dirname(sourcePath).replace(spacePath, buildPath);

                const literal = './' + path.relative(sourceBuildPath, resolvedTargetPath);
                Log.debug('compiler', 'trf.replace_import', `Transforming '${importPath}' into './${literal}'`)

                return ts.factory.updateImportDeclaration(
                    node,
                    node.modifiers,
                    node.importClause,
                    ts.factory.createStringLiteral(
                        literal,
                        true
                    ),
                    node.attributes
                );
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };
    
        return (node) => ts.visitNode(node, visit)
    };
    return transformer;
}
