import { $Module, $Space } from '~/schema';
import { $Job, $JobAssert, $JobMethod } from '../job.schema';
import { TrxNode } from '~/engine/transaction/trx_node';
import { BlockBuilder } from '../../block.builder';
import { $Dependency, ResolvedBuilderNode } from '~/engine/dependency';
import { JobExtrasAndAsserts } from '../job.builder';
import { Overlay } from '~/engine/util/type';
import { NesoiError } from '~/engine/data/error';

/*
    Job created inside a machine definition
*/

export class MachineJobBuilder<
    Space extends $Space,
    Module extends $Module,
    Name extends string,
    Job extends $Job = $Job,
    Ctx = {}
> extends BlockBuilder<Space, Module, 'job'> {
    public $b = 'job' as const;
    public $j = 'MachineJob' as const;

    private _extrasAndAsserts: JobExtrasAndAsserts = [];
    private _method?: $JobMethod<any, any, any, any>;
    
    private machine: string

    constructor(
        protected module: string,
        protected name: Name,
        private alias: string,
        protected _authn = [] as string[],
        protected _inputMsgs: $Dependency[] = []
    ) {
        super(module, 'job', name);
        this.machine = name.split('@')[0];
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
        Trx = NoInfer<TrxNode<Space,Module,Job['#authn']>>,
        Msg = NoInfer<Job['#input']['#parsed']>,
        PreviousExtras = NoInfer<Job['#extra']>,
        C = NoInfer<Ctx>
    >(
        $: $JobMethod<Trx, Msg, Extra, PreviousExtras, C>
    ) {
        this._extrasAndAsserts.push({ extra: $ as any });
        return this as MachineJobBuilder<
            Space, Module, Name, Overlay<Job, {
                '#extra': Job['#extra'] & Extra
            }>, Ctx
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
        Trx = NoInfer<TrxNode<Space,Module,Job['#authn']>>,
        Msg = NoInfer<Job['#input']['#parsed']>,
        Extras = NoInfer<Job['#extra']>,
        C = NoInfer<Ctx>
    >(
        condition: $JobAssert<Trx, Msg, Extras, Ctx>
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
     * @param action A function which returns one of the output messages or the response message
     */
    method<
        Trx = NoInfer<TrxNode<Space,Module, Job['#authn']>>,
        Msg = NoInfer<Job['#input']['#parsed']>,
        Extras = NoInfer<Job['#extra']>,
        C = NoInfer<Ctx>
    >(
        action: $JobMethod<Trx, Msg, any, Extras, C>
    ) {
        this._method = action as any;
        return this;
    }

    /** Build */

    public static build(node: MachineJobBuilderNode, input: $Dependency[]) {
        if (!node.builder._method) {
            throw NesoiError.Builder.Job.NoMethod({ job: node.builder.name })
        }
        node.schema = new $Job(
            node.builder.module,
            node.builder.name,
            node.builder.alias || node.builder.name,
            node.builder._authn,
            [...node.builder._inputMsgs, ...input],
            {},
            node.builder._extrasAndAsserts,
            node.builder._method,
            {
                module: node.builder.module,
                machine: node.builder.machine
            }
        );
        return node.schema;
    }

}

export type AnyMachineJobBuilder = MachineJobBuilder<any, any, any, any, any>

export type MachineJobDef<
    S extends $Space,
    M extends $Module,
    Name extends string,
    Job extends $Job,
    Ctx = {}
> = ($: MachineJobBuilder<S, M, Name, Job, Ctx>) => void

export type MachineJobBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyMachineJobBuilder,
    schema?: $Job
}