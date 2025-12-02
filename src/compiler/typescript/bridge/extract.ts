import type { Compiler } from '~/compiler/compiler';
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { tsFnQueryResult } from '../typescript_compiler';

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
        return scan.filter(s => s.path.startsWith(`${node.builder.$b}(${name})`));

    }

    public static functions(compiler: Compiler, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;

        if (Array.isArray(node.filepath)) {
            if (!['constants', 'externals'].includes(node.builder.$b)) {
                Log.warn('compiler', 'bridge.extract', 'It\'s currently not possible to transfer ts code from multiple builder files to a single schema. Skipping this node.', { tag: node.tag, filepath: node.filepath })
            }
            return;
        }

        const scan = tsCompiler.scan(node.filepath);

        const functions: tsFnQueryResult[] = [];
        
        if (node.builder.$b === 'bucket') {

            throw 'AAA';


            // functions.push(...tsCompiler.query(node.filepath, {
            //     query: 'bucket.*.view.1.return.*.computed.0',
            //     expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            // }) as tsFnQueryResult[]);
            // functions.push(...tsCompiler.query(node.filepath, {
            //     query: 'bucket.*.view.1.return.*.{~..0}.return.{~}.computed',
            //     expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            // }) as tsFnQueryResult[]);
            // functions.push(...tsCompiler.query(node.filepath, {
            //     query: 'bucket.*.view.1.return.**.transform.0',
            //     expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            // }) as tsFnQueryResult[]);
            // functions.push(...tsCompiler.query(node.filepath, {
            //     query: 'bucket.*.tenancy.0.*',
            //     expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            // }) as tsFnQueryResult[]);
        }   
        console.log({functions});

        if (node.builder.$b === 'message') {
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'message.*.template.0.return.*.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'message.*.template.0.return.*.{~.#.*?}.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
        }          

        if (node.builder.$b === 'job') {
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'job.*.auth.1',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'job.*.message.1.return.*.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'job.*.message.1.return.*.{~.#.*?}.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'job.*.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);
        }          

        if (node.builder.$b === 'resource') {
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.auth.1',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.create.0.return.auth.1',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.create.0.return.input.0.return.*.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.create.0.return.input.0.return.*.{~.#.*?}.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.create.0.return.extra|assert|prepare|after.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);
            
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.update.0.return.auth.1',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.update.0.return.input.0.return.*.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.update.0.return.input.0.return.*.{~.#.*?}.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.update.0.return.extra|assert|prepare|after.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);
            
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.delete.0.return.auth.1',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.delete.0.return.input.0.return.*.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.delete.0.return.input.0.return.*.{~.#.*?}.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'resource.*.delete.0.return.extra|assert|prepare|after.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);          
        }          


        if (node.builder.$b === 'machine') {
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.message.1.return.**.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.message.1.return.{**.obj.0}.**.rule.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression, ts.SyntaxKind.PropertyAccessExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.beforeEnter.0.return.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.afterEnter.0.return.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.beforeLeave.0.return.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.afterLeave.0.return.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.transition.1.return.if.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.transition.1.return.{else.0.return}.if.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);

            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.transition.1.return.runJob.0.return.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);
            functions.push(...tsCompiler.query(node.filepath, {
                query: 'machine.*.{state.1.return}.transition.1.return.{else.0.return}.runJob.0.return.extra|assert|method.0',
                expectedKinds: [ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.Identifier, ts.SyntaxKind.CallExpression]
            }) as tsFnQueryResult[]);
            
        }   


        if (functions.length) {
            Log.debug('compiler', 'bridge.extract', `Extracted TS code from ${node.filepath}`, functions.map(f => f.path))
        }

        return functions
    }

}