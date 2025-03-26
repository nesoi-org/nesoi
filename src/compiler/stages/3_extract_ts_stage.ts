import * as ts from 'typescript';
import { Compiler } from '../compiler';
import { Log } from '~/engine/util/log';
import { TSBridgeExtract } from '../typescript/bridge/extract';
import { OrganizedExtract, TSBridgeOrganize } from '../typescript/bridge/organize';

/**
 * [Compiler Stage #3]
 * Extract TypeScript sources (methods and imports) from builders
 */
export class ExtractTSStage {

    constructor(
        public compiler: Compiler
    ) {}

    public run() {
        Log.info('compiler', 'stage.extract_ts', 'Extracting TypeScript code from builders...');

        const { tree } = this.compiler;
        const nodes = tree.allNodes();

        const extract: Record<string, {
            imports: string[],
            types: {
                path: string,
                type: string
            }[]
            functions: {
                path: string,
                node: ts.FunctionExpression | ts.ArrowFunction
            }[]
        }> = {};

        const organized: OrganizedExtract = {
            buckets: {},
            messages: {},
            jobs: {},
            machines: {}
        }

        nodes.forEach(node => {
            if (node.isInline) {
                return
            }

            const imports = TSBridgeExtract.imports(this.compiler, node);
            if (imports) {
                extract[node.tag] = { imports, types: [], functions: [] }
            }
            
            const types = TSBridgeExtract.types(this.compiler, node);            
            const functions = TSBridgeExtract.functions(this.compiler, node);

            if (!types && !functions) {
                return
            }

            const nodeOrganized = TSBridgeOrganize.functions(types, functions);

            Object.assign(organized.buckets, nodeOrganized.buckets)
            Object.assign(organized.messages, nodeOrganized.messages)
            Object.assign(organized.jobs, nodeOrganized.jobs)
            Object.assign(organized.machines, nodeOrganized.machines)
        })

        nodes.forEach(node => {
            const imports = node.isInline
                ? extract[node.root!.tag]?.imports
                : extract[node.tag]?.imports

            let e;
            if (node.builder.$b === 'bucket') {
                e = organized.buckets[node.tag];
            }
            else if (node.builder.$b === 'message') {
                e = organized.messages[node.tag];
            }
            else if (node.builder.$b === 'job') {
                e = organized.jobs[node.tag];
            }
            else if (node.builder.$b === 'machine') {
                e = organized.machines[node.tag];
            }

            node.bridge = {
                imports,
                extract: e,
                appDependencies: [] // TODO
            }
        })

        Log.trace('compiler', 'stage.extract_ts', 'Finished extracting TS code', organized);
    }

}