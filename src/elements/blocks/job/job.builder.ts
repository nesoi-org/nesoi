import { $Module, $Space, ScopedMessage, ScopedMessageName } from '~/schema';
import { $Job, $JobAssert, $JobMethod } from './job.schema';
import { BlockBuilder } from '../block.builder';
import { MultiMessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { Overlay } from '~/engine/util/type';
import { $MessageInfer } from '~/elements/entities/message/message.infer';
import { TrxNode } from '~/engine/transaction/trx_node';
import { ModuleTree } from '~/engine/tree';
import { $Dependency, $Tag, ResolvedBuilderNode } from '~/engine/dependency';
import { $Message } from '~/elements/entities/message/message.schema';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { ResourceJobBuilder, ResourceJobBuilderNode } from './internal/resource_job.builder';
import { MachineJobBuilder, MachineJobBuilderNode } from './internal/machine_job.builder';
import { NesoiError } from '~/engine/data/error';
import { $BlockOutput } from '../block.schema';

export type JobExtrasAndAsserts = (
    { extra: $JobMethod<any, any, any, any, any> } |
    { assert: $JobAssert<any, any, any, any> }
)[]

/**
 * @category Builders
 * @subcategory Block
 */
export class JobBuilder<
    Space extends $Space,
    Module extends $Module,
    Job extends $Job = $Job,
    Ctx = {}
> extends BlockBuilder<Space, Module, 'job'> {
    public $b = 'job' as const;
    public $j = 'Job' as const;

    private _extrasAndAsserts: JobExtrasAndAsserts = [];
    private _method?: $JobMethod<any, any, any, any, any>; 
    private _scope?: string

    constructor(
        module: string,
        name: Job['name']
    ) {
        super(module, 'job', name);
    }

    /* [Block] */

    public authn<
        U extends keyof Space['authnUsers']
    >(...providers: U[]) {
        return super.authn(...providers as string[]) as unknown as JobBuilder<
            Space, Module,
            Overlay<Job, { '#authn': { [K in U]: Space['authnUsers'][U] } }>,
            Ctx
        >;
    }

    /* [Scope] */

    public scope<
        JobScope extends `machine:${keyof Module['machines'] & string}`,
        Machine extends NoInfer<Module['machines'][JobScope extends `machine:${infer X}` ? X : never]>
    >(scope: JobScope) {
        this._scope = scope;

        // Machine-scoped job
        return this as unknown as JobBuilder<
            Space, Module, Job, {
                obj: Machine['#data'],
                from: keyof Machine['states'] & string,
                to: keyof Machine['states'] & string,
            }
        >;
    }
    

    /* [Job] */

    public messages<
        Def extends MultiMessageTemplateDef<Space, Module>
    >(def: Def) {
        type Messages = {
            [K in keyof ReturnType<Def> as `${Job['name']}${K extends '' ? '' : '.'}${K & string}`]: $MessageInfer<`${Job['name']}${K extends '' ? '' : '.'}${K & string}`, ($: any) => ReturnType<Def>[K] >
        }
        return super.messages(def) as unknown as JobBuilder<
            Space,
            Overlay<Module, {
                messages: Overlay<Module['messages'], Messages>
            }>,
            Job, Ctx
        >;
    }

    public input<
        MsgName extends ScopedMessageName<Module, Job['name']>,
        Msg extends NoInfer<ScopedMessage<Module, Job['name'], MsgName>>
    >(...def: MsgName[]) {
        return super._input(...def) as unknown as JobBuilder<
            Space, Module, Overlay<Job, {
                '#input': Msg
            }>, Ctx
        >;
    }

    public get output() {
        return {
            raw: this.outputRaw.bind(this),
            msg: this.outputMsg.bind(this),
            obj: this.outputObj.bind(this)
        }
    }

    protected outputRaw<T>() {
        // super.outputRaw()
        return this as unknown as JobBuilder<
            Space, Module, Overlay<Job, {
                '#output': unknown extends Job['#output'] ? T : (Job['#output'] | T)
            }>, Ctx
        >;
    }

    protected outputMsg<
        MsgName extends ScopedMessageName<Module, Job['name']>,
        Msg extends NoInfer<ScopedMessage<Module, Job['name'], MsgName>>
    >(
        ...msgs: MsgName[]
    ) {
        super.outputMsg()
        return this as unknown as JobBuilder<
            Space, Module, Overlay<Job, {
                '#output': unknown extends Job['#output'] ? Msg['#parsed'] : (Job['#output'] | Msg['#parsed'])
            }>, Ctx
        >;
    }

    protected outputObj<
        BucketName extends keyof Module['buckets'],
        Bucket extends NoInfer<Module['buckets'][BucketName]>
    >(
        ...objs: BucketName[]
    ) {
        super.outputObj()
        return this as unknown as JobBuilder<
            Space, Module, Overlay<Job, {
                '#output': unknown extends Job['#output'] ? Bucket['#data'] : (Job['#output'] | Bucket['#data'])
            }>, Ctx
        >;
    }

    /*
        Extra
    */

    /**
     * A function that will build new fields on the input message to be
     * consumed by the job.
     * 
     * @param $ A function which returns an object to be assigned to the input.
     */
    extra<
        Extra extends { [_: string]: any },
        Trx = NoInfer<TrxNode<Space, Module, Job['#authn']>>,
        Msg = NoInfer<Job['#input']['#parsed']>,
        PreviousExtras = NoInfer<Job['#extra']>,
        C = NoInfer<Ctx>
    >(
        $: $JobMethod<Trx, Msg, Extra, PreviousExtras, C>
    ) {
        this._extrasAndAsserts.push({ extra: $ });
        return this as unknown as JobBuilder<
            Space, Module, Job & {
                '#extra': Job['#extra'] & Extra
            }, Ctx
        >;
    }

    /*
        Assert
    */

    /**
     * A function that checks a given condition over the input and throws an exception;
     * This assertion runs before the job method.
     * 
     * @param { cond } A function which returns true or false
     * @param { error } An error message or a function that makes one
     */
    assert<
        Trx = NoInfer<TrxNode<Space, Module, Job['#authn']>>,
        Msg = NoInfer<Job['#input']['#parsed']>,
        Extras = NoInfer<Job['#extra']>,
        C = NoInfer<Ctx>
    >(
        condition: $JobAssert<Trx, Msg, Extras, C>
    ) {
        this._extrasAndAsserts.push({ assert: condition as any });
        return this;
    }
    
    /*
        Action
    */

    /**
     * The function called when the job is run.
     * 
     * @param method A function which returns one of the output messages or the response message
     */
    method<
        Trx = NoInfer<TrxNode<Space, Module, Job['#authn']>>,
        Msg = NoInfer<Job['#input']['#parsed']>,
        Extras = NoInfer<Job['#extra']>,
        C = NoInfer<Ctx>
    >(
        method: $JobMethod<Trx,Msg,Job['#output'],Extras,C>
    ) {
        (this._method as any) = method;
        return this;
    }

    // Build

    public static build(node: JobBuilderNode, tree: ModuleTree, module: $Module) {

        if (!node.builder._method) {
            throw NesoiError.Builder.Job.NoMethod({ job: node.builder.name })
        }

        const input = node.builder._inputMsgs;
        const scope = node.builder._scope ? $Tag.parse(node.builder._scope) : undefined
        node.schema = new $Job(
            node.builder.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._authn,
            input,
            node.builder._output,
            node.builder._extrasAndAsserts,
            node.builder._method,
            
            scope ? {
                module: node.builder.module,
                machine: scope.name,
            } : undefined
        );
        return {
            schema: node.schema,
            inlineMessages: MessageBuilder.buildInlines(node, tree, module)
        };
    }

    // Build Inline

    public static buildInlines(node: ResolvedBuilderNode, tree: ModuleTree, module: $Module, config?: JobBuildConfig) {
        const nodeInlines = node.inlines.job || {};

        const inlineJobs: Record<string, $Job> = {};
        const nestedInlineMessages: Record<string, $Message> = {};

        for (const name in nodeInlines || {}) {
            const inline = nodeInlines[name];
            const $j = inline.builder.$j;
            
            if ($j === 'Job') {
                const job = JobBuilder.build(inline as JobBuilderNode, tree, module);
                inlineJobs[name] = job.schema;
                Object.assign(nestedInlineMessages, job.inlineMessages);
            }
            else if ($j === 'ResourceJob') {
                const cfg = config![name].ResourceJob!;
                const job = ResourceJobBuilder.build(inline as ResourceJobBuilderNode, tree, module,
                    cfg.output,
                    cfg.defaultTrigger,
                    cfg.idType
                )
                inlineJobs[name] = job.schema;
                Object.assign(nestedInlineMessages, job.inlineMessages);
            }
            else if ($j === 'MachineJob') {
                const cfg = config![name]?.MachineJob
                const job = MachineJobBuilder.build(inline as MachineJobBuilderNode, cfg?.input || [])
                inlineJobs[name] = job;
            }
        }

        return { inlineJobs, nestedInlineMessages };
    }

}

export type AnyJobBuilder = JobBuilder<any, any, any>

export type JobBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyJobBuilder,
    schema?: $Job
}

export type JobBuildConfig = {
    [name: string]: {
        ResourceJob?: {
            idType?: 'string' | 'int' | null,
            output: $BlockOutput,
            defaultTrigger: $Message
        },
        MachineJob?: {
            input: $Dependency[]
        }
    }
}