import { $Module, $Space } from '~/schema';
import { $Machine, $MachineLogFn, $MachineStates, $MachineTransitions } from './machine.schema';
import { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { $MessageInfer } from '~/elements/entities/message/message.infer';
import { AnyMachineStateBuilder, MachineStateBuilder, MachineStateDef } from './machine_state.builder';
import { BlockBuilder } from '../block.builder';
import { Overlay } from '~/engine/util/type';
import { ModuleTree } from '~/engine/tree';
import { JobBuildConfig, JobBuilder } from '../job/job.builder';
import { $Dependency, ResolvedBuilderNode } from '~/engine/dependency';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { MachineTransitionBuilder } from './machine_transition.builder';
import { $Message } from '~/elements';

/**
 * @category Builders
 * @subcategory Block
 */
export class MachineBuilder<
    Space extends $Space,
    Module extends $Module,
    Name extends string,
    $ extends $Machine = $Machine
> extends BlockBuilder<Space, Module, 'machine'> {
    public $b = 'machine' as const;

    private _buckets: $Dependency[] = [];
    private _stateField!: string;
    private _stateAliasField?: string;
    private _states: Record<string, MachineStateBuilder<Space,Module,$>> = {};

    private _logger?: $MachineLogFn<any>

    constructor(
        module: string,
        name: Name,
    ) {
        super(module, 'machine', name);
    }

    /* [Block] */

    public auth<U extends keyof Space['authnUsers']>(
        provider: U,
        resolver?: (user: Space['authnUsers'][U]) => boolean
    ) {
        return super.auth(provider, resolver) as unknown as MachineBuilder<
            Space, Module, Name,
            Overlay<$, { '#authn': $['#authn'] & { [K in U]: Space['authnUsers'][K] } }>
        >;
    }

    public message<
        Name extends string,
        Def extends MessageTemplateDef<Space, Module, Name>,
        FullName extends string = `${$['name']}${Name extends '' ? '' : '.'}${Name & string}`,
        Msg extends $Message = $MessageInfer<FullName, ($: any) => ReturnType<Def>>
    >(name: Name, def: Def) {
        return super.message(name, def) as unknown as MachineBuilder<
            Space,
            Overlay<Module, {
                messages: Overlay<Module['messages'], {
                    [K in FullName]: Msg
                }>
            }>,
            Name,
            $
        >;
    }

    /* [Data] */

    bucket<
        M extends keyof Module['buckets']
    >(names: M | M[]) {
        names = Array.isArray(names) ? names : [names];
        this._buckets = names.map(name => 
            new $Dependency(this.module, 'bucket', name as string)
        );
        return this as unknown as MachineBuilder<
            Space, Module, Name,
            $ & { '#data': Module['buckets'][M]['#data'] }
        >;
    }

    public stateField(key: {
        [K in keyof $['#data']]: $['#data'][K] extends string ? K : never
    }[keyof $['#data']]) {
        this._stateField = key as string;
        return this;
    }

    public stateAliasField(key: {
        [K in keyof $['#data']]: $['#data'][K] extends string ? K : never
    }[keyof $['#data']]) {
        this._stateAliasField = key as string;
        return this;
    }

    /* The machine nodes */

    public state<
        Name extends string,
        Def extends MachineStateDef<Space,Module,$,$['states'][Name]>
    >(name: Name, $?: Def) {
        const builder = new MachineStateBuilder(this, this.module, name, Object.values(this._states).length === 0);
        if ($) {
            $(builder as any);
        }
        this._states[name] = builder as AnyMachineStateBuilder;
        return this;
        // return this as unknown as MachineBuilder<Space, Module, Name, $ & {
        //     states: {
        //         [K in Name]: TMachineState<{ path: Name }>
        //     }
        // }>;
    }

    public logger($: $MachineLogFn<$>) {
        this._logger = $;
        return this;
    }

    /* Build */
    
    public static build(node: MachineBuilderNode, tree: ModuleTree, module: $Module) {

        const states: $MachineStates = {};
        const transitions: $MachineTransitions = {
            from: {},
            to: {}
        };

        // Build substates
        for (const key in node.builder._states) {
            const childBuilder = node.builder._states[key];
            const child = MachineStateBuilder.build(childBuilder);
            Object.assign(states, child.states);
            MachineTransitionBuilder.merge(transitions, child.transitions);
        }

        // Asign unique inputs to states based on transitions to that state
        Object.entries(transitions.to)
            .forEach(([state, msgTransitions]) => {
                Object.values(msgTransitions)
                    .flat(1)
                    .forEach(t => {
                        if (!states[state].input.some(dep => dep.tag === t.msg.tag)) {
                            states[state].input.push(t.msg);
                        }
                    })
            });

        const input = Object.values(states)
            .map(state => state.input)
            .flat(1);

        const jobs: $Dependency[] = [];
        Object.values(states).forEach(state => {
            jobs.push(...Object.values(state.jobs));
        })
        Object.values(transitions.from).forEach(stateTransitions => {
            Object.values(stateTransitions).forEach(transitionList => {
                transitionList.forEach(trans => {
                    jobs.push(...trans.jobs);
                })
            })
        })

        node.schema = new $Machine(
            node.builder.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._auth,
            input,
            node.builder._buckets,
            jobs,
            node.builder._stateField || 'state',
            states,
            transitions,
            node.builder._stateAliasField,
            node.builder._logger
        );


        // Configure state jobs with proper input, based on transition targets
        const inlineJobsConfig: JobBuildConfig = {}
        Object.values(states).forEach(state => {

            const transFrom = transitions.from[state.name] || {};
            const inputLeave: $Dependency[] = []
            Object.values(transFrom)
                .flat(1)
                .filter($t => !inputLeave.some(dep => dep.tag === $t.msg.tag))
                .forEach($t => inputLeave.push($t.msg))
            
            const transTo = transitions.to[state.name] || {};
            const inputEnter: $Dependency[] = []
            Object.values(transTo)
                .flat(1)
                .filter($t => !inputEnter.some(dep => dep.tag === $t.msg.tag))
                .forEach($t => inputEnter.push($t.msg))
                
            state.inputEnter = inputEnter;
            state.inputLeave = inputLeave;

            if (state.jobs.beforeEnter) {
                inlineJobsConfig[state.jobs.beforeEnter.name] = {
                    MachineJob: { input: inputEnter }
                }
            }
            if (state.jobs.afterEnter) {
                inlineJobsConfig[state.jobs.afterEnter.name] = {
                    MachineJob: { input: inputEnter }
                }
            }
            if (state.jobs.beforeLeave) {
                inlineJobsConfig[state.jobs.beforeLeave.name] = {
                    MachineJob: { input: inputLeave }
                }
            }
            if (state.jobs.afterLeave) {
                inlineJobsConfig[state.jobs.afterLeave.name] = {
                    MachineJob: { input: inputLeave }
                }
            }
            
        })

        const { inlineJobs, nestedInlineMessages } = JobBuilder.buildInlines(node, tree, module, inlineJobsConfig);


        return {
            schema: node.schema,
            inlineMessages: {
                ...MessageBuilder.buildInlines(node, tree, module),
                ...nestedInlineMessages
            },
            inlineJobs
        };
    }

}

export type AnyMachineBuilder = MachineBuilder<any, any, any, any>
export type MachineDef = ($: AnyMachineBuilder) => any

export type MachineBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyMachineBuilder,
    schema?: $Machine
}