import type { ResolvedBuilderNode} from '~/engine/dependency';
import type { Compiler } from '~/compiler/compiler';
import type { $MachineTransition } from '~/elements/blocks/machine/machine.schema';

import { Log } from '~/engine/util/log';
import type { $Bucket } from '~/elements';

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
                // console.log({np: node.path, field, scan_path, i_op, path})

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
                    // console.log({i_op, i_path, p, op, ptr});
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
                    throw new Error(`(TS Bridge) Invalid computed path '${node.path}'`);
                }
                
                ptr.meta.computed = { fn: {
                    __fn: tsCompiler.getFnText(node.node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any }
                ptr['#data'] = tsCompiler.getReturnType(node.node);
            }
        }


        // console.log(node.bridge!.nodes);
        // const { tsCompiler } = compiler;
        // const schema = node.schema! as $Bucket;
        // const typeName = NameHelpers.names(schema).type;

        // Object.entries(extract.views).forEach(([name, view]) => {
        //     // TODO
        //     Object.entries(view?.computed || {}).forEach(([prop, node]) => {
        //         console.log({prop, node});
                
        //         let f = { children: schema.views[name].fields } as $BucketViewField;
        //         prop.split('.').forEach(p => {
        //             f = f.children![p];
        //         }) 
        //         // f.meta.computed = { fn: {
        //         //     __fn: tsCompiler.getFnText(node),
        //         //     __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //         // } as any }
        //         // f['#data'] = tsCompiler.getReturnType(node);
        //     })
        //     // Object.entries(view?.chain || {}).forEach(([prop, node]) => {
        //     //     let f = { children: schema.views[name].fields } as $BucketViewField;
        //     //     prop.split('.').forEach(p => {
        //     //         f = f.children![p];
        //     //     }) 
        //     //     f.chain!.meta.computed = { fn: {
        //     //         __fn: tsCompiler.getFnText(node),
        //     //         __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //     //     } as any }
        //     //     f['#data'] = tsCompiler.getReturnType(node);
        //     // })
        // })

        // Object.entries(extract.tenancy).forEach(([provider, node]) => {
        //     schema.tenancy![provider] = {
        //         __fn: tsCompiler.getFnText(node, ''),
        //         __fn_type: `(acc: Space['authnUsers']['${provider}']) => any`,
        //     } as any
        // })
    }

    private static message(compiler: Compiler, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        // const { tsCompiler } = compiler;
        // const schema = node.schema! as $Message;
        
        // const _extract = extract ? { rules: {...extract.rules} } : { rules: {}};

        // // Step 1: Go through all .msg() fields of the message,
        // // and join the referenced extract into this.
        // $MessageTemplate.forEachField(schema.template, (field, path) => {
        //     if (!field.meta.msg) return;
        //     const ref = nodes.find(node => Tag.matches(node.tag, field.meta.msg!.tag));
        //     if (!ref) {
        //         throw new Error(`Unable to inject code from .msg() field, ${field.meta.msg!.tag.full} not found`);
        //     }
        //     const refExtract = ref.bridge?.extract as MessageFnExtract;
        //     if (!refExtract) return;
        //     for (const key in refExtract.rules) {
        //         const _path = path + '.' + key;
        //         _extract.rules[_path] = refExtract.rules[key];
        //     }
        // })

        // const getFields = (root: $MessageTemplateField, prop: string) => {
        //     const path = prop.split('.');
        //     let poll: $MessageTemplateField[] = [root];
        //     for (const p of path) {
        //         if (poll.length === 0) break;

        //         // Walk to next layer of fields by path
        //         const next: $MessageTemplateField[] = [];
        //         for (const n of poll) {
        //             const child = n.children?.[p];
        //             if (child) {
        //                 next.push(child)
        //             }
        //         }
        //         poll = next;
        //     }
        //     return poll;
        // }

        // Object.entries(_extract?.rules || {}).forEach(([path, rules]) => {
        //     const fields = getFields({ children: schema.template.fields } as $MessageTemplateField, path);
        //     for (const field of fields) {
        //         field.rules = rules.map(fn => ({
        //             __fn: tsCompiler.getFnText(fn),
        //             __fn_type: '(...args: any[]) => any',
        //         } as any));
        //     }
        // })
    }

    private static job(compiler: Compiler, node: ResolvedBuilderNode) {
        // const { tsCompiler } = compiler;
        // const schema = node.schema! as $Job;

        // if (extract.authResolver) {
        //     schema.auth.forEach((a, i) => {
        //         a.resolver = {
        //             __fn: tsCompiler.getFnText(extract.authResolver![i]),
        //             __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //         } as any;
        //     })
        // }

        // if (extract.extrasAndAsserts) {
        //     if (extract.extrasAndAsserts.length !== schema.extrasAndAsserts.length) {
        //         throw new Error(`Mismatching length of extracted asserts/extras for job ${schema.module}::${schema.name}. Expected ${schema.extrasAndAsserts.length}, but found ${extract.extrasAndAsserts.length}`)
        //     }
        //     schema.extrasAndAsserts = extract.extrasAndAsserts.map(e => {
        //         const t = Object.keys(e)[0];
        //         return {
        //             [t]: {
        //                 __fn: tsCompiler.getFnText((e as any)[t]),
        //                 __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //             }
        //         } as any
        //     });
        // }

        // if (extract.method) {
        //     schema.method = {
        //         __fn: tsCompiler.getFnText(extract.method),
        //         __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //     } as any;

        //     // No output specified, infer from function
        //     if (!schema.output) {
        //         schema['#output'] = tsCompiler.getReturnType(extract.method);
        //     }
        // }

        // if (extract.prepare) {
        //     const scope = schema.scope! as $ResourceJobScope;
        //     scope.prepareMethod = {
        //         __fn: tsCompiler.getFnText(extract.prepare),
        //         __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //     } as any;
        // }
        // if (extract.after) {
        //     const scope = schema.scope! as $ResourceJobScope;
        //     scope.afterMethod = {
        //         __fn: tsCompiler.getFnText(extract.after),
        //         __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //     } as any;
        // }
        // if (extract.outputRaw) {
        //     schema.output ??= {}
        //     schema.output.raw = extract.outputRaw
        //     schema['#output'] = undefined; // Will be recalculated by element based on output
        // }
    }


    private static resource(compiler: Compiler, node: ResolvedBuilderNode) {
        // const { tsCompiler } = compiler;
        // const schema = node.schema! as $Job;

        // if (extract.authResolver) {
        //     schema.auth.forEach((a, i) => {
        //         a.resolver = {
        //             __fn: tsCompiler.getFnText(extract.authResolver![i]),
        //             __fn_type: '(...args: any[]) => any', // TODO: evaluate
        //         } as any;
        //     })
        // }
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