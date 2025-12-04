import { Tag, type ResolvedBuilderNode} from '~/engine/dependency';
import type { Compiler } from '~/compiler/compiler';
import type { $MachineTransition } from '~/elements/blocks/machine/machine.schema';

import * as ts from 'typescript';
import { Log } from '~/engine/util/log';
import type { $Bucket, $Job, $Message } from '~/elements';
import type { tsScanCallChain, tsScanTree, TypeScriptCompiler } from '../typescript_compiler';
import { type $MessageTemplateField, type $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import type { $BucketViewField, $BucketViewFieldOp, $BucketViewFields } from '~/elements/entities/bucket/view/bucket_view.schema';

const debug = false;

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

    private static code(tsCompiler: TypeScriptCompiler, node: tsScanTree) {
        const code_node = node['%']!;
        return tsCompiler.getCode(code_node)
    }

    private static bucket(compiler: Compiler, node: ResolvedBuilderNode) {

        const { tsCompiler } = compiler;
        const schema = node.schema! as $Bucket;
        
        const tree = node.bridge!.nodes as tsScanCallChain;
        if (!tree.length) return;

        for (const tree_node of tree) {
            // Tenancy
            if (tree_node['#'] === 'tenancy') {
                const providers = tree_node[0] as tsScanTree;
                for (const key in providers) {
                    schema.tenancy![key] = {
                        __fn: TSBridgeInject.code(tsCompiler, providers[key] as tsScanTree),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                }
            }
        }      

        // View

        const view_node = tree.find(node => node['#'] === 'view') as tsScanTree;
        if (!view_node) return;

        if (debug) {
            console.log(JSON.stringify(view_node, (key, node) => (typeof node === 'object' && 'kind' in node as any) ? ts.SyntaxKind[(node as any).kind] : node, 2))
        }
        
        const parseFields = (fields: $BucketViewFields, fields_tree: tsScanTree) => {
            if (debug) {
                console.log({fields, fields_tree})
            }
            for (const key in fields_tree) {
                parseField(fields[key], fields_tree[key]['>>']!);
            }
        }

        const parseField = (field: $BucketViewField, field_chain: tsScanCallChain) => {
            if (debug) {
                console.log({field, field_chain})
            }

            // Find the position of the field on the chain, to start
            // reading ops from the next
            let i;

            // Computed -> extract code
            if (field.type === 'computed') {
                i = field_chain.findIndex(c => c['#'] === 'computed');
                field.meta.computed!.fn = {
                    __fn: TSBridgeInject.code(tsCompiler, field_chain[i][0]),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }
            // Query (params) -> extract code
            else if (field.type === 'query') {
                i = field_chain.findIndex(c => c['#'] === 'query');
                if ('params' in field.meta.query! && field.meta.query!['params']) {
                    field.meta.query!.params = {
                        __fn: TSBridgeInject.code(tsCompiler, field_chain[i][3]),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                }
            }
            // Obj -> children fields
            else if (field.type === 'obj') {
                const subview = field.ops[0] as Extract<$BucketViewFieldOp, { type: 'subview' }>;
                i = field_chain.findIndex(c => c['#'] === 'obj');
                parseFields(subview.children, field_chain[i][0]);
            }
            else if (field.type === 'model' || field.type === 'view' || field.type === 'drive') {
                i = field_chain.findIndex(c => c['#'] === field.type);
            }
            else if (field.type === 'inject') {
                i = field_chain.findIndex(c => c['#'] === 'inject') + 1;
            }
            else {
                throw `Unknown field type ${field.type}`;
            }

            // Children ops

            // [Special Case]: Model with spread, the chain following the field
            // actually applies to ops inside the ops[0] (which is a map).
            if (field.type === 'model' && field.meta.model!.path.endsWith('.*')) {
                const map = field.ops[0] as Extract<$BucketViewFieldOp, { type: 'map' }>;
                parseOps(map.ops, field_chain.slice(i+1));
            }
            else {
                parseOps(field.ops, field_chain.slice(i+1));
            }

        }        

        const parseOps = (ops: $BucketViewFieldOp[], op_chain: tsScanCallChain) => {
            if (debug) {
                console.log({ops, op_chain})
            }

            // The operation is iterated separately, given a chain node yields 2 operations (obj + pick)
            let op_i = 0;

            for (let i = 0; i < op_chain.length; i++) {

                const op = ops[op_i];
                const op_node = op_chain[i];

                if (debug) {
                    console.log({op, op_node})
                }

                // Transform -> extract code
                if (op.type === 'transform') {
                    op.fn = {
                        __fn: TSBridgeInject.code(tsCompiler, op_node[0]),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                }
                // Map -> children ops
                else if (op.type === 'map') {
                    // The slice is required to remove the $ identifier
                    parseOps(op.ops, op_node[0]['=>']['>>']!.slice(1));
                }
                // Obj/Chain -> children fields
                else if (op.type === 'subview') {
                    // A chain op is a subview + pick, proceed on a single node
                    if (op_node['#'] === 'chain') {
                        parseField(op.children['#'], op_node[0]['=>']['>>']!)
                    }
                    // Otherwise, proceed on all fields
                    else {
                        parseFields(op.children, op_node[0]['=>'])
                    }
                }

                if (op_node['#'] === 'chain') op_i += 2;
                else op_i++;
            }
        }

        const view_name = view_node[0]['#']!;
        parseFields(schema.views[view_name].fields, view_node[1]['=>']);
    }

    private static message(compiler: Compiler, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Message;

        const tree = node.bridge!.nodes as tsScanCallChain;
        if (!tree.length) return;
        
        const tree_fields = tree.find(node => node['#'] === 'template')![0]['=>'] as tsScanTree;

        if (debug) {
            console.log(JSON.stringify(tree_fields, (key, node) => (typeof node === 'object' && 'kind' in node as any) ? ts.SyntaxKind[(node as any).kind] : node, 2))
        }

        const parseFields = (fields: $MessageTemplateFields, fields_tree: tsScanTree) => {
            if (debug) {
                console.log({fields, fields_tree})
            }

            for (const key in fields_tree) {
                parseField(fields[key], fields_tree[key]['>>']!);
            }
        }

        const parseField = (field: $MessageTemplateField, field_chain: tsScanCallChain) => {
            if (debug) {
                console.log({field, field_chain})
            }

            // References
            if (field_chain.find(c => c['#'] === 'msg')) {
                const ref = nodes.find(node => Tag.matches(node.tag, field.meta.msg!.tag));
                if (!ref) {
                    throw new Error(`Unable to inject code from .msg() field, '${field.meta.msg!.tag.full}' not found`);
                }
                const ref_tree = ref.bridge!.nodes;
                const ref_tree_fields = ref_tree.find(node => node['#'] === 'template')![0]['=>'];
                parseFields(field.children!, ref_tree_fields);
            }

                
            // Children
            else if (field.type === 'obj') {
                const child_chain = field_chain.find(c => c['#'] === 'obj')!;
                parseFields(field.children!, child_chain[0]);
            }
            else if (field.type === 'list') {
                const child_chain = field_chain.find(c => c['#'] === 'list')!;
                parseField(field.children!['#'], child_chain[0]['>>']!);
            }
            else if (field.type === 'dict') {
                const child_chain = field_chain.find(c => c['#'] === 'dict')!;
                parseField(field.children!['#'], child_chain[0]['>>']!);
            }
            else if (field.type === 'union') {
                const child_chain = field_chain.find(c => c['#'] === 'union')!;
                for (const key in child_chain) {
                    if (key === '#' || key === '%') continue;
                    parseField(field.children![key], child_chain[key]['>>']!);
                }
            }

            // Rule
            let rule_i = 0;
            for (const node of field_chain) {
                if (node['#'] === 'rule') {
                    field.rules[rule_i] = {
                        __fn: TSBridgeInject.code(tsCompiler, node[0]),
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
            if (tree_node['#'] === 'method') {
                schema.method = {
                    __fn: TSBridgeInject.code(tsCompiler, tree_node[0]),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }

            // Auth
            if (tree_node['#'] === 'auth') {
                if ('1' in tree_node) {
                    schema.auth[auth_i].resolver = {
                        __fn: TSBridgeInject.code(tsCompiler, tree_node[1]),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                    auth_i++;
                }
            }
            
            // Extra / Assert
            if (tree_node['#'] === 'extra' || tree_node['#'] === 'assert') {
                schema.extrasAndAsserts[extras_and_asserts_i] = {
                    __fn: TSBridgeInject.code(tsCompiler, tree_node[0]),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                extras_and_asserts_i++;
            }
            
            if (!(schema.scope && 'method' in schema.scope)) {
                continue;
            }

            // [Resource] Prepare
            if (tree_node['#'] === 'prepare') {
                schema.scope.prepareMethod = {
                    __fn: TSBridgeInject.code(tsCompiler, tree_node[0]),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
                extras_and_asserts_i++;
            }
            if (tree_node['#'] === 'after') {
                schema.scope.afterMethod = {
                    __fn: TSBridgeInject.code(tsCompiler, tree_node[0]),
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
            if (tree_node['#'] === 'auth') {
                if ('1' in tree_node) {
                    schema.auth[auth_i].resolver = {
                        __fn: TSBridgeInject.code(tsCompiler, tree_node[1] as tsScanTree),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    } as any
                    auth_i++;
                }
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