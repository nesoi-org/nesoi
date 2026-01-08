import type { Compiler } from '../compiler';

import { Log } from '~/engine/util/log';
import { TSBridgeExtract } from '../typescript/bridge/extract';
import type { tsScanCallChain, tsScanTree } from '../typescript/typescript_compiler';
import { Tag } from '~/engine/dependency';
import type { AnyResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import type { AnyBucketBuilder } from '~/elements/entities/bucket/bucket.builder';

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

        nodes.forEach(node => {
            if (node.progressive) {
                return
            }
            if (node.isInline) {
                return
            }
            
            const imports = TSBridgeExtract.imports(this.compiler, node) ?? [];            
            const types = TSBridgeExtract.types(this.compiler, node) ?? [];            
            const scan_nodes = TSBridgeExtract.nodes(this.compiler, node) ?? [];

            node.bridge = { imports, types, nodes: scan_nodes }

            /* Organize Imports */

            // Extended buckets
            if (node.builder.$b === 'bucket') {
                const extend = (node.builder as any)._extend as AnyBucketBuilder['_extend'];
                if (extend) {
                    const base_node = nodes.find(node => Tag.matches(node.tag, extend.tag))!;
                    node.bridge.imports.push(...base_node?.bridge?.imports ?? [])
                }
            }

            /* Organize nodes */

            const addInlineMessage = (msg_name: string, tree: tsScanTree) => {
                const tag = new Tag(node.tag.module, 'message', msg_name);
                const msg_node = nodes.find(node => Tag.matches(node.tag, tag));
                if (!msg_node) {
                    throw new Error(`Message ${msg_name} not found on module ${node.tag.module}`);
                }
                msg_node.bridge = { imports, types: [], nodes: [
                    {
                        '#': 'template',
                        0: {
                            '=>': tree
                        }
                    } as any
                ]}
            }

            const addInlineJob = (job_name: string, chain: tsScanCallChain) => {
                if (!chain.length) return;
                const input_i = chain.findIndex(node => node['#'] === 'input');

                if (input_i >= 0) {
                    const input = chain[input_i];
                    const tree = input[0]['=>'];
                    addInlineMessage(job_name, tree);
                }

                const tag = new Tag(node.tag.module, 'job', job_name);
                const job_node = nodes.find(node => Tag.matches(node.tag, tag));
                if (!job_node) {
                    throw new Error(`Job ${job_name} not found on module ${node.tag.module}`);
                }
                job_node.bridge = { imports, types: [], nodes: chain }
            }

            // Inline Messages
            if (node.builder.$b !== 'message') {
                for (const scan_node of scan_nodes) {        
                    if (scan_node['#'] === 'message') {
                        const msg_local_name = scan_node[0]['#']!;
                        const tree = scan_node[1]['=>'];
                        const msg_name = (node.builder as any).name + (msg_local_name ? ('.'+msg_local_name) : '');
                        addInlineMessage(msg_name, tree);                  
                    }    
                }
            }

            // Inline Resource Jobs
            if (node.builder.$b === 'resource') {
                const resource_name = (node.builder as any).name as AnyResourceBuilder['name'];
                
                for (const scan_node of scan_nodes) {
                    if (!('0' in scan_node)) continue;
                    if (!('=>' in scan_node[0])) continue;
                    const sub_chain = scan_node[0]['=>']['>>']!;
                    if (scan_node['#'] === 'create') {
                        addInlineJob(resource_name+'.create', sub_chain)
                    }
                    else if (scan_node['#'] === 'update') {
                        addInlineJob(resource_name+'.update', sub_chain)
                    }
                    else if (scan_node['#'] === 'delete') {
                        addInlineJob(resource_name+'.delete', sub_chain)
                    }
                }
            }

        })


        const t = new Date().getTime();
        Log.debug('compiler', 'stage.extract_ts', `[t: ${(t-t0)/1000} ms]`);
        Log.trace('compiler', 'stage.extract_ts', 'Finished extracting TS code');
    }

}