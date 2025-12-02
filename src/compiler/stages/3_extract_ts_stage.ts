import type { Compiler } from '../compiler';

import { Log } from '~/engine/util/log';
import { TSBridgeExtract } from '../typescript/bridge/extract';
import type { tsScanResult, tsTypeScanResult } from '../typescript/typescript_compiler';

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
            types: tsTypeScanResult
            nodes: tsScanResult
        }> = {};

        nodes.forEach(node => {
            if (node.progressive) {
                return
            }
            if (node.isInline) {
                return
            }
            
            const imports = TSBridgeExtract.imports(this.compiler, node) ?? [];            
            const types = TSBridgeExtract.types(this.compiler, node) ?? [];            
            const nodes = TSBridgeExtract.nodes(this.compiler, node) ?? [];

            node.bridge = { imports, types, nodes }
        })


        const t = new Date().getTime();
        Log.debug('compiler', 'stage.extract_ts', `[t: ${(t-t0)/1000} ms]`);
        Log.trace('compiler', 'stage.extract_ts', 'Finished extracting TS code');
    }

}