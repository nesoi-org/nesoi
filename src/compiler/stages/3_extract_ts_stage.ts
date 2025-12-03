import type { Compiler } from '../compiler';

import { Log } from '~/engine/util/log';
import { TSBridgeExtract } from '../typescript/bridge/extract';
import { Tag } from '~/engine/dependency';
import type ts from 'typescript';

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

            node.bridge ??= { imports: [], types: [], nodes: [] }
            node.bridge.imports.push(...imports);
            node.bridge.types.push(...types);
            node.bridge.nodes.push(...scan_nodes);

            node.bridge = { imports, types, nodes: scan_nodes }

            const inlineMessages: {
                name: string
                path: string
                node: ts.Node
            }[] = [];
            const inlineJobs: {
                name: string
                path: string
                node: ts.Node
            }[] = [];

            for (const scan_node of scan_nodes) {
                const inlineMessageMatch = scan_node.path.match(/^.*?\([^)]+\)(\..+)*\.message\(([^)]*)\)\.1/);

                // Inline Messages
                if (inlineMessageMatch) {
                    const [_, _1, message] = inlineMessageMatch;
                    const name = node.tag.name + (message.length ? ('.'+message) : '');
                    inlineMessages.push({
                        name,
                        path: scan_node.path.replace(_, 'message().template.0'),
                        node: scan_node.node
                    });
                }
                
                if (!scan_node.path.startsWith('resource(')) continue;
                
                // Resource Create
                const inlineResourceCreateMessageMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.create\.0\.input\.0/);
                if (inlineResourceCreateMessageMatch) {
                    const [_] = inlineResourceCreateMessageMatch;
                    const name = node.tag.name + '.create';
                    inlineMessages.push({
                        name,
                        path: scan_node.path.replace(_, 'message().template.0'),
                        node: scan_node.node
                    });
                }
                const inlineResourceCreatePrepareMethodMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.create\.0(.*?)\.prepare\.0\.%/);
                if (inlineResourceCreatePrepareMethodMatch) {
                    const [_] = inlineResourceCreatePrepareMethodMatch;
                    const name = node.tag.name+'.create';
                    inlineJobs.push({
                        name,
                        path: scan_node.path.replace(_, 'job().prepare.0.%'),
                        node: scan_node.node
                    });
                }
                const inlineResourceCreateAfterMethodMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.create\.0(.*?)\.after\.0\.%/);
                if (inlineResourceCreateAfterMethodMatch) {
                    const [_] = inlineResourceCreateAfterMethodMatch;
                    const name = node.tag.name+'.create';
                    inlineJobs.push({
                        name,
                        path: scan_node.path.replace(_, 'job().after.0.%'),
                        node: scan_node.node
                    });
                }

                // Resource Update
                const inlineResourceUpdateMessageMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.update\.0\.input\.0/);
                if (inlineResourceUpdateMessageMatch) {
                    const [_] = inlineResourceUpdateMessageMatch;
                    const name = node.tag.name + '.update';
                    inlineMessages.push({
                        name,
                        path: scan_node.path.replace(_, 'message().template.0'),
                        node: scan_node.node
                    });
                }
                const inlineResourceUpdatePrepareMethodMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.update\.0(.*?)\.prepare\.0\.%/);
                if (inlineResourceUpdatePrepareMethodMatch) {
                    const [_] = inlineResourceUpdatePrepareMethodMatch;
                    const name = node.tag.name+'.update';
                    inlineJobs.push({
                        name,
                        path: scan_node.path.replace(_, 'job().prepare.0.%'),
                        node: scan_node.node
                    });
                }
                const inlineResourceUpdateAfterMethodMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.update\.0(.*?)\.after\.0\.%/);
                if (inlineResourceUpdateAfterMethodMatch) {
                    const [_] = inlineResourceUpdateAfterMethodMatch;
                    const name = node.tag.name+'.update';
                    inlineJobs.push({
                        name,
                        path: scan_node.path.replace(_, 'job().after.0.%'),
                        node: scan_node.node
                    });
                }

                // Resource Delete
                const inlineResourceDeleteMessageMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.delete\.0\.input\.0/);
                if (inlineResourceDeleteMessageMatch) {
                    const [_] = inlineResourceDeleteMessageMatch;
                    const name = node.tag.name + '.delete';
                    inlineMessages.push({
                        name,
                        path: scan_node.path.replace(_, 'message().template.0'),
                        node: scan_node.node
                    });
                }
                const inlineResourceDeletePrepareMethodMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.delete\.0(.*?)\.prepare\.0\.%/);
                if (inlineResourceDeletePrepareMethodMatch) {
                    const [_] = inlineResourceDeletePrepareMethodMatch;
                    const name = node.tag.name+'.delete';
                    inlineJobs.push({
                        name,
                        path: scan_node.path.replace(_, 'job().prepare.0.%'),
                        node: scan_node.node
                    });
                }
                const inlineResourceDeleteAfterMethodMatch = scan_node.path.match(/resource?\([^)]+\)(\.[^\d]+)*\.delete\.0(.*?)\.after\.0\.%/);
                if (inlineResourceDeleteAfterMethodMatch) {
                    const [_] = inlineResourceDeleteAfterMethodMatch;
                    const name = node.tag.name+'.delete';
                    inlineJobs.push({
                        name,
                        path: scan_node.path.replace(_, 'job().after.0.%'),
                        node: scan_node.node
                    });
                }

            }

            // 

            for (const msg of inlineMessages) {
                const tag = new Tag(node.tag.module, 'message', msg.name.replaceAll('ᐅ','.'));
                const msg_node = nodes.find(node => Tag.matches(node.tag, tag));
                if (!msg_node) {
                    throw `Message ${msg.name} not found on module ${node.tag.module}`;
                }
                msg_node.bridge ??= { imports: [], types: [], nodes: [] }
                msg_node.bridge.nodes.push(msg);
            }

            for (const job of inlineJobs) {
                const tag = new Tag(node.tag.module, 'job', job.name.replaceAll('ᐅ','.'));
                const job_node = nodes.find(node => Tag.matches(node.tag, tag));
                if (!job_node) {
                    throw `Job ${job.name} not found on module ${node.tag.module}`;
                }
                job_node.bridge ??= { imports: [], types: [], nodes: [] }
                job_node.bridge.nodes.push(job);
            }

        })


        const t = new Date().getTime();
        Log.debug('compiler', 'stage.extract_ts', `[t: ${(t-t0)/1000} ms]`);
        Log.trace('compiler', 'stage.extract_ts', 'Finished extracting TS code');
    }

}