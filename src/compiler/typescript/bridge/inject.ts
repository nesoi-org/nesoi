import { Tag, type ResolvedBuilderNode} from '~/engine/dependency';
import type { Compiler } from '~/compiler/compiler';
import type { $MachineTransition } from '~/elements/blocks/machine/machine.schema';

import type * as ts from 'typescript';
import { Log } from '~/engine/util/log';
import type { $Bucket, $Job, $Message } from '~/elements';
import type { tsScanCallArgs, tsScanCallChain, tsScanTree } from '../typescript_compiler';
import { type $MessageTemplateField, type $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import type { $BucketViewField, $BucketViewFieldOp, $BucketViewFields } from '~/elements/entities/bucket/view/bucket_view.schema';

export class TSBridgeInject {

    public static inject(compiler: Compiler, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        
        if (node.progressive) return;
        Log.debug('compiler', 'bridge.inject', `Injecting TS code on ${node.tag}`)

        const schema = node.schema!;

        if (schema.$t === 'bucket') {
            this.bucket(compiler, node)
        }
        if (schema.$t === 'message') {
            this.message(compiler, nodes, node)
        }
        if (schema.$t === 'job') {
            this.job(compiler, node)
        }
        if (schema.$t === 'machine') {
            this.machine(compiler, node)
        }
        if (schema.$t === 'resource') {
            this.resource(compiler, node)
        }

    }

    private static bucket(compiler: Compiler, node: ResolvedBuilderNode) {

        const { tsCompiler } = compiler;
        const schema = node.schema! as $Bucket;
        
        const tree = node.bridge!.nodes as tsScanCallChain;
        if (!tree.length) return;

        for (const tree_node of tree) {
            
            // Tenancy
            if (tree_node.__expr === 'tenancy') {
                const providers = tree_node[0] as tsScanTree;
                for (const key in providers) {
                    const fn = (providers[key] as tsScanTree)['%'] as ts.Node;
                    schema.tenancy![key] = {
                        __fn: tsCompiler.getFnText(fn),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                }
            }
            
        }

        // View

        const tree_fields = (tree.find(node => node.__expr === 'view') as tsScanTree) as tsScanTree;
        if (!tree_fields) return;
        
        const parseFields = (fields: $BucketViewFields, tree_fields: tsScanTree) => {
            for (const key in tree_fields) {
                if (key === '%') continue;
                parseField(fields[key], tree_fields[key] as tsScanCallChain);
            }
        }

        const parseField = (field: $BucketViewField, chain: tsScanCallChain) => {
            // Computed
            if (field.type === 'computed') {
                const fn = ((chain[0] as tsScanTree)[0] as tsScanTree)['%'] as ts.Node;
                field.meta.computed!.fn = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }
            // Query (params)
            else if (field.type === 'query') {
                if ('params' in field.meta.query! && field.meta.query!['params']) {
                    const fn = (chain[0][3] as tsScanTree)['%'] as ts.Node;
                    field.meta.query!.params = {
                        __fn: tsCompiler.getFnText(fn),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                }
            }

            // Children Fields
            else if (field.type === 'obj') {
                const subview = field.ops[0] as Extract<$BucketViewFieldOp, { type: 'subview' }>;
                parseFields(subview.children, chain[0][0] as tsScanTree);
            }

            // Children Ops            
            if (field.type === 'model' && field.meta.model!.path.endsWith('.*')) {
                const map = field.ops[0] as Extract<$BucketViewFieldOp, { type: 'map' }>;
                parseOps(map.ops, chain.slice(1));
            }
            else {
                parseOps(field.ops, chain.slice(1));
            }

        }        

        const parseOps = (ops: $BucketViewFieldOp[], chain: tsScanCallChain) => {
            let op_i = 0;
            for (let i = 0; i < chain.length; i++) {
                const op = ops[op_i];

                // Transform
                if (op.type === 'transform') {
                    const fn = ((chain[0] as tsScanTree)[0] as tsScanTree)['%'] as ts.Node;
                    op.fn = {
                        __fn: tsCompiler.getFnText(fn),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                }

                // Children Ops
                if (op.type === 'map') {
                    parseOps(op.ops, (chain[i][0] as tsScanTree)['=>'] as tsScanCallChain)
                }

                // Children Fields
                else if (op.type === 'subview') {
                    if (chain[i].__expr === 'chain') {
                        parseField(op.children['#'], (chain[i][0] as tsScanTree)['=>'] as tsScanCallChain)
                    }
                    else {
                        parseFields(op.children, (chain[i][0] as tsScanTree)['=>'] as tsScanTree)
                    }
                }

                if (chain[i].__expr === 'chain') op_i += 2;
                else op_i++;
            }
        }

        const view_name = (tree_fields['()'] as tsScanCallArgs)[0];
        parseFields(schema.views[view_name].fields, (tree_fields[1] as tsScanTree)['=>'] as tsScanTree);
    }

    private static message(compiler: Compiler, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Message;

        const tree = node.bridge!.nodes as tsScanCallChain;
        if (!tree.length) return;
        
        const tree_fields = ((tree.find(node => node.__expr === 'template')! as tsScanTree)[0] as tsScanTree)['=>'] as tsScanTree;
        const parseFields = (fields: $MessageTemplateFields, tree_fields: tsScanTree) => {
            for (const key in tree_fields) {
                if (key === '%') continue;
                parseField(fields[key], tree_fields[key] as tsScanCallChain);
            }
        }

        const parseField = (field: $MessageTemplateField, chain: tsScanCallChain) => {

            // References
            if (chain[0].__expr === 'msg') {
                const ref = nodes.find(node => Tag.matches(node.tag, field.meta.msg!.tag));
                if (!ref) {
                    throw new Error(`Unable to inject code from .msg() field, '${field.meta.msg!.tag.full}' not found`);
                }
                const ref_tree = ref.bridge!.nodes;
                const ref_tree_fields = ((ref_tree.find(node => node.__expr === 'template')! as tsScanTree)[0] as tsScanTree)['=>'] as tsScanTree;
                parseFields(field.children!, ref_tree_fields);
            }

                
            // Children
            else if (field.type === 'obj') {
                const child_chain = chain[0][0] as tsScanTree;
                parseFields(field.children!, child_chain);
            }
            else if (field.type === 'list') {
                parseField(field.children!['#'], chain[0][0] as tsScanCallChain);
            }
            else if (field.type === 'dict') {
                parseField(field.children!['#'], chain[0][0] as tsScanCallChain);
            }
            else if (field.type === 'union') {
                for (const key in chain[0]) {
                    if (key === '__expr' || key === '()') continue;
                    parseField(field.children![key], chain[0][key] as tsScanCallChain);
                }
            }

            // Rule
            let rule_i = 0;
            for (const node of chain) {
                if (node.__expr === 'rule') {
                    const fn = (node[0] as tsScanTree)['%'] as ts.Node;
                    field.rules[rule_i] = {
                        __fn: tsCompiler.getFnText(fn),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                    rule_i++;
                }
            }
        }        

        parseFields(schema.template.fields, tree_fields);
    }

    private static job(compiler: Compiler, node: ResolvedBuilderNode) {

        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

        const tree = node.bridge!.nodes as tsScanCallChain;
        if (!tree.length) return;

        let auth_i = 0;
        let extras_and_asserts_i = 0;
        for (const tree_node of tree) {
            
            // Method
            if (tree_node.__expr === 'method') {
                const fn = (tree_node[0] as tsScanTree)['%'] as ts.Node;
                schema.method = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }

            // Auth
            if (tree_node.__expr === 'auth') {
                const fn = (tree_node[1] as tsScanTree)['%'] as ts.Node;
                schema.auth[auth_i].resolver = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                auth_i++;
            }
            
            // Extra / Assert
            if (tree_node.__expr === 'extra' || tree_node.__expr === 'assert') {
                const fn = (tree_node[0] as tsScanTree)['%'] as ts.Node;
                schema.extrasAndAsserts[extras_and_asserts_i] = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                extras_and_asserts_i++;
            }
            
            if (!(schema.scope && 'method' in schema.scope)) {
                continue;
            }

            // [Resource] Prepare
            if (tree_node.__expr === 'prepare') {
                const fn = (tree_node[0] as tsScanTree)['%'] as ts.Node;
                schema.scope.prepareMethod = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                extras_and_asserts_i++;
            }
            if (tree_node.__expr === 'after') {
                const fn = (tree_node[0] as tsScanTree)['%'] as ts.Node;
                schema.scope.afterMethod = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                extras_and_asserts_i++;
            }
        }
    }


    private static resource(compiler: Compiler, node: ResolvedBuilderNode) {
        
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

        const tree = node.bridge!.nodes as tsScanCallChain;
        if (!tree.length) return;

        let auth_i = 0;
        for (const tree_node of tree) {

            // Auth
            if (tree_node.__expr === 'auth') {
                const fn = (tree_node[1] as tsScanTree)['%'] as ts.Node;
                schema.auth[auth_i].resolver = {
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                auth_i++;
            }
        }
    }

    private static machine(compiler: Compiler, node: ResolvedBuilderNode) {
        // const { tsCompiler } = compiler;
        // const schema = node.schema! as $Machine;

        // Object.entries(extract.states).forEach(([sname, state]) => {
        //     Object.entries(state.transitions || {}).forEach(([tname, trst]) => {
        //         const transitions = schema.transitions.from[sname][tname];
        //         TSBridgeInject.machineTransitions(compiler, trst, transitions)
        //     })
        // })
    }

    private static machineTransitions(compiler: Compiler, transitions: $MachineTransition[]) {
        // const { tsCompiler } = compiler;

        // extract.forEach((fn, i) => {
        //     if (fn.if) {
        //         transitions[i].condition = {
        //             __fn: tsCompiler.getFnText(fn.if),
        //             __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //         } as any
        //     }
        // })

    }
}