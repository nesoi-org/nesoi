import type { ResolvedBuilderNode} from '~/engine/dependency';
import type { BucketFnExtract, JobFnExtract, MachineFnExtract, MachineTransitionFnExtract, MessageFnExtract, ResourceFnExtract } from './organize';
import type { $BucketViewField } from '~/elements/entities/bucket/view/bucket_view.schema';
import type { Compiler } from '~/compiler/compiler';
import type { $Bucket, $Machine, $Message } from '~/elements';
import type { $MessageTemplateField } from '~/elements/entities/message/template/message_template.schema';
import type { $Job } from '~/elements/blocks/job/job.schema';
import type { $ResourceJobScope } from '~/elements/blocks/job/internal/resource_job.schema';
import type { $MachineTransition } from '~/elements/blocks/machine/machine.schema';

import { Tag } from '~/engine/dependency';
import { Log } from '~/engine/util/log';
import { $MessageTemplate } from '~/elements/entities/message/template/message_template.schema';
import { NameHelpers } from '~/engine/util/name_helpers';

export class TSBridgeInject {

    public static inject(compiler: Compiler, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        
        if (node.progressive) return;
        Log.debug('compiler', 'bridge.inject', `Injecting TS code on ${node.tag}`)

        const schema = node.schema!;

        if (schema.$t === 'bucket') {
            const extract = node.bridge?.extract as BucketFnExtract;
            if (!extract) return;
            this.bucket(compiler, extract, node)
        }
        if (schema.$t === 'message') {
            const extract = node.bridge?.extract as MessageFnExtract;
            this.message(compiler, extract, nodes, node)
        }
        if (schema.$t === 'job') {
            const extract = node.bridge?.extract as JobFnExtract;
            if (!extract) return;
            this.job(compiler, extract, node)
        }
        if (schema.$t === 'machine') {
            const extract = node.bridge?.extract as MachineFnExtract;
            if (!extract) return;
            this.machine(compiler, extract, node)
        }
        if (schema.$t === 'resource') {
            const extract = node.bridge?.extract as ResourceFnExtract;
            if (!extract) return;
            this.resource(compiler, extract, node)
        }

    }

    private static bucket(compiler: Compiler, extract: BucketFnExtract, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Bucket;
        const typeName = NameHelpers.names(schema).type;

        Object.entries(extract.views).forEach(([name, view]) => {
            Object.entries(view?.computed || {}).forEach(([prop, node]) => {
                let f = { children: schema.views[name].fields } as $BucketViewField;
                prop.split('.').forEach(p => {
                    f = f.children![p];
                }) 
                f.meta.computed = { fn: {
                    __fn: tsCompiler.getFnText(node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any }
                f['#data'] = tsCompiler.getReturnType(node);
            })
            Object.entries(view?.chain || {}).forEach(([prop, node]) => {
                let f = { children: schema.views[name].fields } as $BucketViewField;
                prop.split('.').forEach(p => {
                    f = f.children![p];
                }) 
                f.chain!.meta.computed = { fn: {
                    __fn: tsCompiler.getFnText(node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any }
                f['#data'] = tsCompiler.getReturnType(node);
            })
        })

        Object.entries(extract.tenancy).forEach(([provider, node]) => {
            schema.tenancy![provider] = {
                __fn: tsCompiler.getFnText(node, ''),
                __fn_type: `(acc: Space['authnUsers']['${provider}']) => any`,
            } as any
        })
    }

    private static message(compiler: Compiler, extract: MessageFnExtract | undefined, nodes: ResolvedBuilderNode[], node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Message;
        
        const _extract = extract ? { rules: {...extract.rules} } : { rules: {}};

        // Step 1: Go through all .msg() fields of the message,
        // and join the referenced extract into this.
        $MessageTemplate.forEachField(schema.template, (field, path) => {
            if (!field.meta.msg) return;
            const ref = nodes.find(node => Tag.matches(node.tag, field.meta.msg!.tag));
            if (!ref) {
                throw new Error(`Unable to inject code from .msg() field, ${field.meta.msg!.tag.full} not found`);
            }
            const refExtract = ref.bridge?.extract as MessageFnExtract;
            if (!refExtract) return;
            for (const key in refExtract.rules) {
                const _path = path + '.' + key;
                _extract.rules[_path] = refExtract.rules[key];
            }
        })

        const getFields = (root: $MessageTemplateField, prop: string) => {
            const path = prop.split('.');
            let poll: $MessageTemplateField[] = [root];
            for (const p of path) {
                if (poll.length === 0) break;

                // Walk to next layer of fields by path
                const next: $MessageTemplateField[] = [];
                for (const n of poll) {
                    const child = n.children?.[p];
                    if (child) {
                        next.push(child)
                    }
                }
                poll = next;
            }
            return poll;
        }

        Object.entries(_extract?.rules || {}).forEach(([path, rules]) => {
            const fields = getFields({ children: schema.template.fields } as $MessageTemplateField, path);
            for (const field of fields) {
                field.rules = rules.map(fn => ({
                    __fn: tsCompiler.getFnText(fn),
                    __fn_type: '(...args: any[]) => any',
                } as any));
            }
        })
    }

    private static job(compiler: Compiler, extract: JobFnExtract, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

        if (extract.authResolver) {
            schema.auth.forEach((a, i) => {
                a.resolver = {
                    __fn: tsCompiler.getFnText(extract.authResolver![i]),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any;
            })
        }

        if (extract.extrasAndAsserts) {
            if (extract.extrasAndAsserts.length !== schema.extrasAndAsserts.length) {
                throw new Error(`Mismatching length of extracted asserts/extras for job ${schema.module}::${schema.name}. Expected ${schema.extrasAndAsserts.length}, but found ${extract.extrasAndAsserts.length}`)
            }
            schema.extrasAndAsserts = extract.extrasAndAsserts.map(e => {
                const t = Object.keys(e)[0];
                return {
                    [t]: {
                        __fn: tsCompiler.getFnText((e as any)[t]),
                        __fn_type: '(...args: any[]) => any', // TODO: evaluate
                    }
                } as any
            });
        }

        if (extract.method) {
            schema.method = {
                __fn: tsCompiler.getFnText(extract.method),
                __fn_type: '(...args: any[]) => any', // TODO: evaluate
            } as any;

            // No output specified, infer from function
            if (!schema.output) {
                schema['#output'] = tsCompiler.getReturnType(extract.method);
            }
        }

        if (extract.prepare) {
            const scope = schema.scope! as $ResourceJobScope;
            scope.prepareMethod = {
                __fn: tsCompiler.getFnText(extract.prepare),
                __fn_type: '(...args: any[]) => any', // TODO: evaluate
            } as any;
        }
        if (extract.after) {
            const scope = schema.scope! as $ResourceJobScope;
            scope.afterMethod = {
                __fn: tsCompiler.getFnText(extract.after),
                __fn_type: '(...args: any[]) => any', // TODO: evaluate
            } as any;
        }
        if (extract.outputRaw) {
            schema.output ??= {}
            schema.output.raw = extract.outputRaw
            schema['#output'] = undefined; // Will be recalculated by element based on output
        }
    }


    private static resource(compiler: Compiler, extract: ResourceFnExtract, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

        if (extract.authResolver) {
            schema.auth.forEach((a, i) => {
                a.resolver = {
                    __fn: tsCompiler.getFnText(extract.authResolver![i]),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any;
            })
        }
    }

    private static machine(compiler: Compiler, extract: MachineFnExtract, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Machine;

        Object.entries(extract.states).forEach(([sname, state]) => {
            Object.entries(state.transitions || {}).forEach(([tname, trst]) => {
                const transitions = schema.transitions.from[sname][tname];
                TSBridgeInject.machineTransitions(compiler, trst, transitions)
            })
        })
    }

    private static machineTransitions(compiler: Compiler, extract: MachineTransitionFnExtract[], transitions: $MachineTransition[]) {
        const { tsCompiler } = compiler;

        extract.forEach((fn, i) => {
            if (fn.if) {
                transitions[i].condition = {
                    __fn: tsCompiler.getFnText(fn.if),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any
            }
        })

    }
}