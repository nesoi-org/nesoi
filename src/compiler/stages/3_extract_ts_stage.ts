import * as ts from 'typescript';
import { Compiler } from '../compiler';
import { Log } from '~/engine/util/log';
import { TSBridgeExtract } from '../typescript/bridge/extract';
import { OrganizedExtract, TSBridgeOrganize } from '../typescript/bridge/organize';

/**
 * [Compiler Stage #3]
 * Extract TypeScript sources (methods and imports) from builders
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class ExtractTSStage {

    constructor(
        public compiler: Compiler
    ) {}

    public run() {
        Log.info('compiler', 'stage.extract_ts', 'Extracting TypeScript code from builders...');
        const t0 = new Date().getTime();

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
            if (node.progressive) {
                return
            }
            if (node.isInline) {
                return
            }

            const imports = TSBridgeExtract.imports(this.compiler, node);
            if (imports) {
                extract[node.tag.full] = { imports, types: [], functions: [] }
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
            if (node.progressive) {
                return
            }
            const imports = node.isInline
                ? extract[node.root!.tag.full]?.imports
                : extract[node.tag.full]?.imports

            let e;
            if (node.builder.$b === 'bucket') {
                e = organized.buckets[node.tag.full];
            }
            else if (node.builder.$b === 'message') {
                e = organized.messages[node.tag.full];
            }
            else if (node.builder.$b === 'job') {
                e = organized.jobs[node.tag.full];
            }
            else if (node.builder.$b === 'machine') {
                e = organized.machines[node.tag.full];
            }

            node.bridge = {
                imports,
                extract: e,
                appDependencies: [] // TODO
            }
        })

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.extract_ts', `[t: ${(t-t0)/1000} ms]`);
        Log.trace('compiler', 'stage.extract_ts', 'Finished extracting TS code', organized);
    }

}