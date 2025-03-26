import { $Module, $Space } from '~/schema';
import { $Machine, $MachineTransition, $MachineTransitions } from './machine.schema';
import { $Job, $JobAssert, $JobMethod } from '~/elements/blocks/job/job.schema';
import { TrxNode } from '~/engine/transaction/trx_node';
import { $Dependency, BuilderNode } from '~/engine/dependency';
import { BlockBuilder } from '../block.builder';
import { $Message } from '~/elements/entities/message/message.schema';
import { Overlay } from '~/engine/util/type';
import { AnyMachineBuilder } from './machine.builder';
import { AnyMachineJobBuilder, MachineJobBuilder, MachineJobDef } from '../job/internal/machine_job.builder';

type JobWithMatchingInput<
    M extends $Module,
    Input extends $Message
> = {
    [J in keyof M['jobs']]:
        Input extends M['jobs'][J]['#input']
        ? J
        : never
}[keyof M['jobs']]

export class MachineTransitionBuilder<
    S extends $Space,
    M extends $Module,
    $M extends $Machine,
    $ extends $MachineTransition = $MachineTransition,
> extends BlockBuilder<S, M, 'machine'> {
    
    private _condition?: $JobMethod<any, any, any, never, any> | $JobAssert<any, any, never, any>;
    private _else?: MachineTransitionBuilder<any, any, any>;
    private _to?: string;

    private _jobs: $Dependency[] = []

    constructor(
        private machine: AnyMachineBuilder,
        module: string,
        private _from: string,
        private _msg: $Dependency,
        private index: number = 0
    ) {
        super(module, 'machine', `${_from}~${_msg.refName}`);
    }

    as(alias: string) {
        this._alias = alias;
        return this;
    }

    if<
        Assert extends $JobAssert<TrxNode<S, M, $M['#authn']>, $['#input']['#parsed'], never, { obj: $M['#data'] }>,
        Condition extends $JobMethod<TrxNode<S, M, $M['#authn']>, $['#input']['#parsed'], boolean, never, { obj: $M['#data'] }>
    >(condition: Assert | Condition) {
        this._condition = condition;
        return this;
    }

    else<
        Def extends MachineTransitionDef<S, M, $M, $>
    >($: Def) {
        const builder = new MachineTransitionBuilder(this.machine, this.module, this._from, this._msg, this.index+1);
        $(builder as any);
        this._else = builder;
        return this;
    }

    goTo<
        To extends keyof $M['states'] | '.'
    >(target: To) {
        this._to = target as string;
        return this as unknown as MachineTransitionBuilder<S,M,$M, Overlay<$, {
            to: To & string
        }>>;
    }


    runJob<
        Def extends MachineJobDef<S, M, $['name'], Overlay<$Job, {
            '#input': $['#input']
        }>, {
            obj: $M['#data'],
            from: $['from'],
            to: $['to'],
        }>,
        Name extends JobWithMatchingInput<M, $['#input']>
    >(def: Name | Def) {
        if (typeof def === 'string') {
            this._jobs.push(new $Dependency(this.module, 'job', def));
        }
        else {
            const machineName = (this.machine as any).name as AnyMachineBuilder['name'];
            const name = `${machineName}@${this.name}#${this.index}`;

            const builder = new MachineJobBuilder(this.module, name, this._alias || name, this._authn, [this._msg]);
            (def as Def)(builder as any);
            this._jobs.push(new $Dependency(this.module, 'job', name));

            // Inline nodes are registered on the machine builder,
            // since a machine transition is not a BuilderNode
            const _inlineNodes = (this.machine as any)._inlineNodes as AnyMachineBuilder['_inlineNodes'];
            _inlineNodes.push(new BuilderNode({
                module: this.module,
                type: 'job',
                name: name,
                builder: builder as AnyMachineJobBuilder,
                isInline: true,
                filepath: [], // This is added later by Treeshake.blockInlineNodes()
                dependencies: [] // This is added later by Treeshake.*()
            }));
        }

        return this;
    }

    /** Util */

    public static merge(
        a: $MachineTransitions,
        b: $MachineTransitions
    ) {
        Object.entries(b.from).forEach(([state, group]) => {
            Object.entries(group).forEach(([msg, transx]) => {
                if (!(state in a.from)) {
                    a.from[state] = {};
                }
                if (!(msg in a.from[state])) {
                    a.from[state][msg] = [];
                }
                a.from[state][msg].push(...transx)
            })
        })
        Object.entries(b.to).forEach(([state, group]) => {
            Object.entries(group).forEach(([msg, transx]) => {
                if (!(state in a.to)) {
                    a.to[state] = {};
                }
                if (!(msg in a.to[state])) {
                    a.to[state][msg] = [];
                }
                a.to[state][msg].push(...transx)
            })
        })
    }

    /** Build */
    
    public static build(
        builder: AnyMachineTransitionBuilder,
    ) {
        const transitions: $MachineTransition[] = [];
        const self = new $MachineTransition(
            builder.module,
            builder.name,
            builder._alias || builder.name,
            builder._authn,
            builder._msg,
            builder._from,
            builder._to || builder._from,
            builder._condition,
            builder._jobs
        );
        transitions.push(self);
        if (builder._else) {
            const others = MachineTransitionBuilder.build(builder._else);
            transitions.push(...others);
        }
        
        // (Inline nodes are registered on the Machine (a transition is not a BuilderNode))

        return transitions;
    }

}

export type MachineTransitionDef<
    S extends $Space,
    M extends $Module,
    $M extends $Machine,
    $ extends $MachineTransition = $MachineTransition
> = ($: MachineTransitionBuilder<S,M,$M,$>) => any

export type AnyMachineTransitionBuilder = MachineTransitionBuilder<any, any, any, any>