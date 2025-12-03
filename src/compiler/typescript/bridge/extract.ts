import type { Compiler } from '~/compiler/compiler';
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { tsFnQueryResult, tsScanCallChain, tsScanTree } from '../typescript_compiler';

import * as ts from 'typescript';
import { Log } from '~/engine/util/log';

export class TSBridgeExtract {


    public static imports(compiler: Compiler, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;

        if (Array.isArray(node.filepath)) {
            if (!['constants', 'externals'].includes(node.builder.$b)) {
                Log.warn('compiler', 'bridge.extract', 'It\'s currently not possible to transfer ts code from multiple builder files to a single schema. Skipping this node.', { tag: node.tag, filepath: node.filepath })
            }
            return;
        }
        const imports = tsCompiler.extractImports(node.filepath);

        if (imports.length) {
            Log.debug('compiler', 'bridge.extract', `Extracted TS imports from ${node.filepath}`, imports)
        }

        return imports;
    }

    public static types(compiler: Compiler, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;

        if (Array.isArray(node.filepath)) {
            if (!['constants', 'externals'].includes(node.builder.$b)) {
                Log.warn('compiler', 'bridge.extract', 'It\'s currently not possible to transfer ts code from multiple builder files to a single schema. Skipping this node.', { tag: node.tag, filepath: node.filepath })
            }
            return;
        }

        const types: { path: string, type: string }[] = [];
        
        if (node.builder.$b === 'job') {
            const rawOutputs = tsCompiler.query(node.filepath, {
                query: 'job.*.output.raw',
                expectedKinds: [ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[];
            
            rawOutputs.forEach(raw => {
                const sig = tsCompiler.checker.getResolvedSignature(raw.node as any);
                if (!sig) return;
                const args = tsCompiler.checker.getTypeArgumentsForResolvedSignature(sig);
                if (!args) return;
                const type = tsCompiler.checker.typeToString(args[0], undefined, ts.TypeFormatFlags.NoTruncation)
                types.push({
                    path: raw.path,
                    type
                })
            })
        }

        if (types.length) {
            Log.debug('compiler', 'bridge.extract', `Extracted TS type from ${node.filepath}`, types.map(f => f.path))
        }

        return types;
    }

    public static nodes(compiler: Compiler, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;

        if (Array.isArray(node.filepath)) {
            if (!['constants', 'externals'].includes(node.builder.$b)) {
                Log.warn('compiler', 'bridge.extract', 'It\'s currently not possible to transfer ts code from multiple builder files to a single schema. Skipping this node.', { tag: node.tag, filepath: node.filepath })
            }
            return;
        }

        const scan = tsCompiler.scan(node.filepath);

        const name = (node.builder as any).module as string + '::' + (node.builder as any).name as string;
        return (scan[node.builder.$b] as tsScanTree)[name] as tsScanCallChain;

    }

}