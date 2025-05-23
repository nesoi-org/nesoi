import { ResolvedBuilderNode } from '~/engine/dependency';
import { BucketFnExtract, JobFnExtract, MachineFnExtract, MachineTransitionFnExtract, MessageFnExtract } from './organize';
import { $BucketViewField } from '~/elements/entities/bucket/view/bucket_view.schema';
import { Compiler } from '~/compiler/compiler';
import { Log } from '~/engine/util/log';
import { $Bucket, $Machine, $Message } from '~/elements';
import { $MessageTemplateField } from '~/elements/entities/message/template/message_template.schema';
import { $Job } from '~/elements/blocks/job/job.schema';
import { NameHelpers } from '~/compiler/helpers/name_helpers';
import { $ResourceJobScope } from '~/elements/blocks/job/internal/resource_job.schema';
import { $MachineTransition } from '~/elements/blocks/machine/machine.schema';

export class TSBridgeInject {

    public static inject(compiler: Compiler, nodes: ResolvedBuilderNode[]) {
        const { tsCompiler } = compiler;
        
        nodes.forEach(node => {
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
                if (!extract) return;
                this.message(compiler, extract, node)
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

        })

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
                f.value.computed = { fn: {
                    __fn: tsCompiler.getFnText(node),
                    __fn_type: '(...args: any[]) => any', // TODO: evaluate
                } as any }
                f['#data'] = tsCompiler.getReturnType(node);
            })
        })
    }

    private static message(compiler: Compiler, extract: MessageFnExtract, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Message;
        const typeName = NameHelpers.names(schema).type;

        Object.entries(extract.rules).forEach(([prop, node]) => {
            let f = { children: schema.template.fields } as $MessageTemplateField;
            let addr = '';
            prop.split('.').forEach(p => {
                f = f.children![p];
                addr += `['${p}${f.type === 'id' ? '_id' : ''}']`;
            })
            const type = `$MessageTemplateRule<${typeName}['#raw']${addr}, ${typeName}['#raw']>`;
            f.rules = node.map(fn => ({
                __fn: tsCompiler.getFnText(fn),
                __fn_type: '(...args: any[]) => any', // TODO: evaluate
            } as any));
        })
    }

    private static job(compiler: Compiler, extract: JobFnExtract, node: ResolvedBuilderNode) {
        const { tsCompiler } = compiler;
        const schema = node.schema! as $Job;

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