import { Tag, type ResolvedBuilderNode} from '~/engine/dependency';
import type { Compiler } from '~/compiler/compiler';
import type { $MachineTransition } from '~/elements/blocks/machine/machine.schema';
import type * as ts from 'typescript';

import { Log } from '~/engine/util/log';
import type { $Bucket, $Job, $Message } from '~/elements';
import type { $MessageTemplateField } from '~/elements/entities/message/template/message_template.schema';
import { $MessageTemplate } from '~/elements/entities/message/template/message_template.schema';
import type { $ResourceJobScope } from '~/elements/blocks/job/internal/resource_job.schema';

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


    // 'as_dict.chain.0.computed.as_list.obj.0.d2'

    private static bucket(compiler: Compiler, node: ResolvedBuilderNode) {

        const { tsCompiler } = compiler;
        const schema = node.schema! as $Bucket;

        const nodes = node.bridge!.nodes;
        for (const node of nodes) {

            // Tenancy
            const tenancyMatch = node.path.match(/bucket\(.*?\).*\.tenancy\.0\.(.*?)\.%/);
            if (tenancyMatch) {
                const [_, provider] = tenancyMatch;
                schema.tenancy![provider] = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }

            // Computed
            /**
                bucket(core::test).tenancy.model.view(default).1.c9.model(propᐅ*).chain.0.model(propᐅ*).chain.0.computed.0.%
                bucket(core::test).tenancy.model.view(default).1.c8.model(propᐅ*).chain.0.computed.0.%
                bucket(core::test).tenancy.model.view(default).1.c7.model(prop).chain.as_dict.obj.0.d3.computed.0.%
                bucket(core::test).tenancy.model.view(default).1.c2.model(prop).chain.0.computed.0.%
                bucket(core::test).tenancy.model.view(default).1.c5.computed.chain.0.computed.0.%
                bucket(core::test).tenancy.model.view(default).1.c1.computed.0.%
             */
            const computedMatch = node.path.match(/bucket\(.*?\).*view\((.*?)\)\.1\.(.*?)\.((.*?)\.)?computed\.0\.%/);
            if (computedMatch) {
                const [_, view, field, _3, scan_path] = computedMatch;

                const path = scan_path?.split('.') ?? [];
                let ptr = schema.views[view].fields[field];
                let i_op = -1;

                for (let i_path = 0; i_path < path.length;) {
                    const p = path[i_path];
                    if (i_op < 0) {
                        if (p.match(/model\(.*ᐅ\*\)/)) {
                            ptr = ptr.ops[0] as any;
                        }
                        if (p !== 'obj') i_path++;
                        i_op = 0;
                        continue;
                    }
                    const op = ptr.ops[i_op];
                    if (op.type === 'subview') {
                        if (path[i_path+1] === '0') {
                            if (p === 'chain') {
                                ptr = op.children['#']
                                i_path += 2;
                            }
                            else if (p === 'obj') {
                                ptr = op.children[path[i_path+2]]
                                i_path += 3;
                            }
                            i_op = -1;
                        }
                        else {
                            if (p === 'chain') i_op += 2;
                            else i_op++;
                            i_path++;
                        }
                    }
                    else {
                        i_path++;
                        i_op++;
                    }
                }
                if (!ptr) {
                    throw new Error(`(TS Bridge) Invalid bucket computed path '${node.path}'`);
                }
                
                ptr.meta.computed = { fn: {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any }
                ptr['#data'] = tsCompiler.getReturnType(node.node);
            }

            // TODO: Transform
        }
    }

    private static message(compiler: Compiler, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Message;

        const msg_nodes: {
            path: string
            node: ts.Node
            root?: $MessageTemplateField
        }[] = node.bridge!.nodes;


        // .msg() fields reference methods from other schemas
        // so we add the extracted nodes for those messages into this
        // the root field allows injecting directly into the field
        $MessageTemplate.forEachField(schema.template, field => {
            if (!field.meta.msg) return;
            const ref = nodes.find(node => Tag.matches(node.tag, field.meta.msg!.tag));
            if (!ref) {
                throw new Error(`Unable to inject code from .msg() field, '${field.meta.msg!.tag.full}' not found`);
            }
            for (const node of ref.bridge!.nodes) {
                msg_nodes.push({
                    ...node,
                    root: field
                })
            }
        })

        for (const node of msg_nodes) {

            // Rule
            /**
                message(core::test).template.0.p.obj.0.a.list.0.dict.0.union.1.rule.0.%
                message(core::test).template.0.p.rule.0.%
            */
            const ruleMatch = node.path.match(/message\(.*?\)\.template\.0\.(.*)\.rule\.0\.%/);


            if (ruleMatch) {
                const [_, scan_path] = ruleMatch;
                

                const path = scan_path.split('.');
                let ptr = (node.root?.children ?? schema.template.fields)[path[0]];
                let rule = 0;
                for (let i = 1; i < path.length;) {
                    const type = path[i];
                    if (type === 'obj') {
                        const p = path[i+2];
                        ptr = ptr.children![p];
                        i += 3;
                    }
                    else if (type === 'list') {
                        ptr = ptr.children!['#'];
                        i += 2;
                    }
                    else if (type === 'dict') {
                        ptr = ptr.children!['#'];
                        i += 2;
                    }
                    else if (type === 'union') {
                        const u = path[i+1];
                        ptr = ptr.children![u];
                        i += 2;
                    }
                    else if (type === 'rule') {
                        rule++;
                        i++;
                    }
                    else {
                        throw new Error(`(TS Bridge) Invalid message rule path '${node.path}'`);
                    }
                }
                if (!ptr) {
                    throw new Error(`(TS Bridge) Invalid message rule path '${node.path}'`);
                }


                ptr.rules[rule] = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }
        }
    }

    private static job(compiler: Compiler, node: ResolvedBuilderNode) {

        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

        const nodes = node.bridge!.nodes;
        for (const node of nodes) {

            // Method
            /*
                job(core::test).message().method.0.%
            */
            const methodMatch = node.path.match(/job\(.*?\).*\.method\.0\.%/);
            if (methodMatch) {
                schema.method = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }

            // Auth Resolvers
            /*
                job(core::test).auth(api).1.%
                job(core::test).auth(api1).auth(api2).1.%
             */
            const authResolverMatch = node.path.match(/job\(.*?\)\.(.*?)\.?(auth\([^)]+\)\.1\.%)/);
            if (authResolverMatch) {
                const [_, path] = authResolverMatch;
                let n = 0;
                path.split('.').forEach(p => {
                    if (p.startsWith('auth(')) n++;
                });
                schema.auth[n].resolver = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }

            // Extras and Asserts
            /*
                job(core::test).message().assert.0.%
                job(core::test).message().assert.extra.0.%
                job(core::test).message().assert.extra.assert.0.%
                job(core::test).message().assert.extra.assert.extra.0.%
             */
            const extraOrAssertMatch = node.path.match(/job\(.*?\)\.message\(.*?\)\.(.*?)\.?(assert|extra)\.0\.%/);
            if (extraOrAssertMatch) {
                const [_, path, type] = extraOrAssertMatch;
                let n = 0;
                path.split('.').forEach(p => {
                    if (p === 'extra' || p === 'assert') n++;
                });
                schema.extrasAndAsserts[n] = {
                    [type]: {
                        __fn: tsCompiler.getFnText(node.node),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    }
                } as any
            }

            // (Resource) Prepare
            /*
                job(core::test).message().method.0.%
            */
            if (node.path === 'job().prepare.0.%') {
                const scope = schema.scope! as $ResourceJobScope;
                scope.prepareMethod = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }

            // (Resource) After
            /*
                job(core::test).message().method.0.%
            */
            if (node.path === 'job().after.0.%') {
                const scope = schema.scope! as $ResourceJobScope;
                scope.afterMethod = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }
        }

        // if (extract.outputRaw) {
        //     schema.output ??= {}
        //     schema.output.raw = extract.outputRaw
        //     schema['#output'] = undefined; // Will be recalculated by element based on output
        // }
    }


    private static resource(compiler: Compiler, node: ResolvedBuilderNode) {
        
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

        const nodes = node.bridge!.nodes;
        for (const node of nodes) {

            // Auth Resolvers
            /*
                resource(core::test).auth(api).1.%
                resource(core::test).auth(api1).auth(api2).1.%
             */
            const authResolverMatch = node.path.match(/resource\(.*?\)\.(.*?)\.?(auth\([^)]+\)\.1\.%)/);
            if (authResolverMatch) {
                const [_, path] = authResolverMatch;
                let n = 0;
                path.split('.').forEach(p => {
                    if (p.startsWith('auth(')) n++;
                });
                schema.auth[n].resolver = {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
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