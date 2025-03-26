import { $Module, $Space, ScopedMessageNameWithId } from '~/schema';
import { $Machine, $MachineState, $MachineStates, $MachineTransition, $MachineTransitions } from './machine.schema';
import { MachineTransitionBuilder, MachineTransitionDef } from './machine_transition.builder';
import { Overlay } from '~/engine/util/type';
import { $Dependency, BuilderNode } from '~/engine/dependency';
import { BlockBuilder } from '../block.builder';
import { $Job } from '../job/job.schema';
import { AnyMachineBuilder } from './machine.builder';
import { NameHelpers } from '~/compiler/helpers/name_helpers';
import { AnyMachineJobBuilder, MachineJobBuilder, MachineJobDef } from '../job/internal/machine_job.builder';

export class MachineStateBuilder<
    S extends $Space,
    M extends $Module,
    $M extends $Machine,
    $ extends $MachineState = $MachineState,
> extends BlockBuilder<S, M, 'machine'> {
    
    private _transitions: Record<string, MachineTransitionBuilder<S, M, $M, any>[]> = {};
    private _states: Record<string, MachineStateBuilder<S,M,$M,any>> = {};
    private _final: boolean = false;

    constructor(
        private machine: AnyMachineBuilder,
        module: string,
        name: string,
        private _initial: boolean = false
    ) {
        super(module, 'machine', name);
    }

    private _jobs = {} as {
        beforeEnter?: $Dependency
        afterEnter?: $Dependency
        beforeLeave?: $Dependency
        afterLeave?: $Dependency
    };

    as(alias: string) {
        this._alias = alias;
        return this;
    }

    final() {
        this._final = true;
        return this;
    }
    
    beforeEnter<
        Def extends MachineJobDef<S, M, `${$['name']}__before_enter`, Overlay<$Job, {
            '#input': $['#input.enter']
        }>, {
            obj: $M['#data'],
            from: $M['transitions']['to'][$['name']][keyof $M['transitions']['to'][$['name']]][number]['from'],
            to: $M['transitions']['to'][$['name']][keyof $M['transitions']['from'][$['name']]][number]['to']
        }>
    >(def: Def) {
        const machineName = (this.machine as any).name as AnyMachineBuilder['name'];
        const name = `${machineName}@${this.name}__before_enter`;
        const builder = new MachineJobBuilder(this.module, name, `Before Enter ${this._alias || this.name}`, this._authn)
        def(builder as any);

        this._jobs.beforeEnter = new $Dependency(this.module, 'job', name);

        // Inline nodes are registered on the machine builder,
        // since a machine state is not a BuilderNode
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

        return this
    }
    
    afterEnter<
        Def extends MachineJobDef<S, M, `${$['name']}__after_enter`, Overlay<$Job, {
            '#input': $['#input.enter']
        }>, {
            obj: $M['#data'],
            from: $M['transitions']['to'][$['name']][keyof $M['transitions']['to'][$['name']]][number]['from'],
            to: $M['transitions']['from'][$['name']][keyof $M['transitions']['from'][$['name']]][number]['to']
        }>
    >(def: Def) {
        const machineName = (this.machine as any).name as AnyMachineBuilder['name'];
        const name = `${machineName}@${this.name}__after_enter`;
        const builder = new MachineJobBuilder(this.module, name, `On Enter ${this._alias || this.name}`, this._authn)
        def(builder as any);

        this._jobs.afterEnter = new $Dependency(this.module, 'job', name);
        
        // Inline nodes are registered on the machine builder,
        // since a machine state is not a BuilderNode
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

        return this
    }
    
    beforeLeave<
        Def extends MachineJobDef<S, M, `${$['name']}__before_leave`, Overlay<$Job, {
            '#input': $['#input.leave']
        }>, {
            obj: $M['#data'],
            from: $M['transitions']['to'][$['name']][keyof $M['transitions']['to'][$['name']]][number]['from'],
            to: $M['transitions']['from'][$['name']][keyof $M['transitions']['from'][$['name']]][number]['to']
        }>
    >(def: Def) {
        const machineName = (this.machine as any).name as AnyMachineBuilder['name'];
        const name = `${machineName}@${this.name}__before_leave`;
        const builder = new MachineJobBuilder(this.module, name, `Before leave ${this._alias || this.name}`, this._authn)
        def(builder as any);

        this._jobs.beforeLeave = new $Dependency(this.module, 'job', name);

        // Inline nodes are registered on the machine builder,
        // since a machine state is not a BuilderNode
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

        return this
    }
    
    afterLeave<
        Def extends MachineJobDef<S, M, `${$['name']}__after_leave`, Overlay<$Job, {
            '#input': $['#input.leave']
        }>, {
            obj: $M['#data'],
            from: $M['transitions']['to'][$['name']][keyof $M['transitions']['to'][$['name']]][number]['from'],
            to: $M['transitions']['from'][$['name']][keyof $M['transitions']['from'][$['name']]][number]['to']
        }>
    >(def: Def) {
        const machineName = (this.machine as any).name as AnyMachineBuilder['name'];
        const name = `${machineName}@${this.name}__after_leave`;
        const builder = new MachineJobBuilder(this.module, name, `On leave ${this._alias || this.name}`, this._authn)
        def(builder as any);

        this._jobs.afterLeave = new $Dependency(this.module, 'job', name);

        // Inline nodes are registered on the machine builder,
        // since a machine state is not a BuilderNode
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

        return this
    }
    
    public transition<
        MsgName extends ScopedMessageNameWithId<M, $M['name'], $M['#data']['id' & keyof $M['#data']]>,
        Def extends MachineTransitionDef<S, M, $M, Overlay<$MachineTransition, {
            '#input': M['messages'][MsgName extends `@.${infer X}` ? `${$M['name']}.${X}` : MsgName]
            from: $['name']
        }>>
    >(msg: MsgName, $: Def) {
        const machineName = (this.machine as any).name as AnyMachineBuilder['name'];
        const msgName = NameHelpers.unabbrevName(msg, machineName);
        const msgDep = new $Dependency(this.module, 'message', msgName);
        
        const builder = new MachineTransitionBuilder(this.machine, this.module, this.name, msgDep);
        $(builder as any);
        if (!(msgName in this._transitions)) {
            this._transitions[msgName] = [];
        }
        this._transitions[msgName].push(builder);
        return this;
    }

    public state<
        Name extends string,
        Def extends MachineStateDef<S,M,$M,$M['states'][`${$['name']}.${Name}`]>
    >(name: Name, $?: Def) {
        const builder = new MachineStateBuilder(this.machine, this.module, `${this.name}.${name}`, Object.values(this._states).length === 0);
        if ($) {
            $(builder as any);
        }
        this._states[name] = builder;
        return this;
    }   

    /** Build */

    public static build(builder: MachineStateBuilder<any, any, any>) {
        const input: $Dependency[] = [];

        // Build all transitions from this state
        const transitions: $MachineTransitions = {
            from: {
                [builder.name]: {}
            },
            to: {}
        };
        // For each state+message, there's a list of transitions
        Object.entries(builder._transitions)
            .forEach(([msgName, msgTransitions]) => {
                // Here we build each transition of the list
                const $transitions = msgTransitions
                    .map(trans => MachineTransitionBuilder.build(trans))
                    .flat(1)
                
                // This list represents all transitions from this state for a given message
                transitions.from[builder.name][msgName] = $transitions;

                // Now, for each transition, we find it's target and store the transition to it
                $transitions.forEach($trans => {
                    if (!($trans.to in transitions.to)) {
                        transitions.to[$trans.to] = {};
                    }
                    if (!($trans.msg.refName in transitions.to[$trans.to])) {
                        transitions.to[$trans.to][$trans.msg.refName] = [];
                    }
                    transitions.to[$trans.to][$trans.msg.refName].push($trans);

                    // We also take note of unique transition input messages
                    if (!input.some(dep => dep.tag === $trans.msg.tag)) {
                        input.push($trans.msg);
                    }
                })
            });        

        // Build this state
        const states: $MachineStates = {};
        states[builder.name] = new $MachineState(
            builder.module,
            builder.name,
            builder._alias || builder.name,
            builder._authn,
            builder._initial,
            builder._final,
            [], // This is filled by the machine (after all transitions are built)
            [], // This is filled by the machine (after all transitions are built)
            builder._jobs
        );

        // Build substates
        for (const key in builder._states) {
            const childBuilder = builder._states[key];
            const child = MachineStateBuilder.build(childBuilder);

            // Merge states, transitions, input and inlineNodes

            Object.assign(states, child.states);
            MachineTransitionBuilder.merge(transitions, child.transitions);
            Object.values(child.states).forEach(state => {
                state.input.forEach(msg => {
                    if (!input.some(dep => dep.tag === msg.tag)) {
                        input.push(msg);
                    }
                })
            })
        }

        // (Inline nodes are registered on the Machine (a state is not a BuilderNode))

        return { states, transitions };
    }

}

export type MachineStateDef<
    S extends $Space,
    M extends $Module,
    $M extends $Machine,
    State extends $MachineState
> = ($: MachineStateBuilder<S,M,$M,State>) => any