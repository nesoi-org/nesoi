import type { $Module, $Space } from '~/schema';
import type { $Machine, $MachineState } from './machine.schema';
import type { Module } from '~/engine/module';
import type { AnyTrxNode} from '~/engine/transaction/trx_node';
import type { AnyMessage} from '~/elements/entities/message/message';
import type { NesoiObjId } from '~/engine/data/obj';
import type { Tag } from '~/engine/dependency';

import { Block } from '../block';
import { TrxNode } from '~/engine/transaction/trx_node';
import { Message } from '~/elements/entities/message/message';
import { NesoiError } from '~/engine/data/error';
import { colored } from '~/engine/util/string';
import { Log } from '~/engine/util/log';

export const MachineOutputCode = {
    'info': {
        'msg_received': 'Message received',
        'state_changed': 'State changed',
        'state_not_changed': 'State didn\'t change',
        'job_returned_message': 'Job returned a message, which will be sent back to the machine',
        'job_unmet_condition': 'A condition of the job was not met',
        'job_from_transition': 'A job was run for the transition',
    },
    'warn': {
        'no_transition_found': 'No matching transition was found',
        'no_transition_run': 'No transition matched the required conditions to run',
    }
}

/**
 * @category Elements
 * @subcategory Block
 */
export class MachineOutputEntry<Type=string, Code=string, Text=string, Data=any> {
    
    constructor(
        public type: Type,
        public code: Code,
        public text: Text,
        public data: Data
    ) {}

    static info_msg_received(msg: AnyMessage, state: string, obj: Record<string, any>) {
        return new MachineOutputEntry(
            'info' as const,
            'msg_received' as const,
            `Message '${msg.$}' received at state '${state}'` as const,
            { msg, state, obj }
        )
    }

    static info_state_changed(from: string, to: string) {
        return new MachineOutputEntry(
            'info' as const,
            'state_changed' as const,
            `State changed from '${from}' to '${to}'` as const,
            { from, to }
        )
    }

    static info_state_not_changed(from: string) {
        return new MachineOutputEntry(
            'info' as const,
            'state_not_changed' as const,
            `State didn't change, remains at '${from}'` as const,
            { from }
        )
    }

    static info_job_returned_message(job: string, msg: AnyMessage) {
        return new MachineOutputEntry(
            'info' as const,
            'job_returned_message' as const,
            `Job '${job}' returned a message '${msg.$}', which was added to the machine queue` as const,
            { job, msg }
        )
    }

    static info_job_from_state(job: string, state: string) {
        return new MachineOutputEntry(
            'info' as const,
            'job_from_state' as const,
            `Job '${job}' ran for state '${state}'` as const,
            { job, state }
        )
    }
    
    static info_unmet_condition(transition: string, error: string) {
        return new MachineOutputEntry(
            'info' as const,
            'unmet_condition' as const,
            `Transition '${transition}' condition failed: '${error}'` as const,
            { transition, error }
        )
    }
    
    static info_job_from_transition(job: string, transition: string) {
        return new MachineOutputEntry(
            'info' as const,
            'job_from_transition' as const,
            `Job '${job}' ran from transition '${transition}'` as const,
            { job, transition }
        )
    }
    
    static warn_no_transition_found(state: string, msg: string) {
        return new MachineOutputEntry(
            'warn' as const,
            'no_transition_found' as const,
            `No transition found for state '${state}' and message '${msg}'` as const,
            { state, msg }
        )
    }
    
    static warn_no_transition_run(state: string) {
        return new MachineOutputEntry(
            'warn' as const,
            'no_transition_run' as const,
            `No transition from state '${state}' passes the assertions` as const,
            { state }
        )
    }
}

/**
 * @category Elements
 * @subcategory Block
 */
export class MachineOutput {
    constructor(
        public entries: MachineOutputEntry[] = []
    ) {}

    public static add(output: MachineOutput, ...entries: MachineOutputEntry[]) {
        output.entries.push(...entries);
    }

    public summary() {
        let str = '\n';
        this.entries.forEach(entry => {
            const pad = ' '.repeat(Math.max(5-entry.type.length, 0));
            const color = {
                'info': 'lightpurple' as const,
                'warn': 'yellow' as const,
                'job': 'lightblue' as const,
                'state': 'lightgreen' as const
            }[entry.type] || 'lightred';

            const type = entry.type ? colored(`[${entry.type}]`, color) : 'unknown';
            str += `- ${type}${pad} ${colored(entry.code, color)}\n`;
            str += `    ${colored(entry.text, 'lightgray')}\n`;
        });
        return str;
    }

    public jobs() {
        return this.entries.filter(entry => 
            entry.type === 'job'
        )
    }
}
/**
 * @category Elements
 * @subcategory Block
 */
export class Machine<
    S extends $Space,
    M extends $Module,
    $ extends $Machine
> extends Block<S,M,$> {

    constructor(
        public module: Module<S, M>,
        public schema: $
    ) {
        super('machine', module, schema);
    }

    protected async run(
        trx: TrxNode<S, M, $['#auth']>,
        msg: AnyMessage & { id: NesoiObjId }
    ): Promise<MachineOutput> {
        
        const { obj, output } = await this._run(trx, msg);
        
        if (this.schema.logger) {
            try {
                await this.schema.logger({
                    trx,
                    schema: this.schema,
                    obj,
                    output
                })
            }
            catch (e: any) {
                Log.error('machine', this.schema.name, 'Logger failed.', {
                    error: e.toString(),
                    stack: e.stack
                });
            }
        }

        return output;
    }

    protected async _run(
        trx: TrxNode<S, M, $['#auth']>,
        _msg: AnyMessage & { id: NesoiObjId }
    ) {
        const output = new MachineOutput();
        const msg = Message.clone(_msg) as typeof _msg;

        if (!msg.id) {
            throw NesoiError.Machine.MessageHasNoId(this.schema.alias);
        }

        // Read data from bucket
        let bucketUsed!: Tag;
        let obj: Record<string, any> | undefined;
        for (const bucket of this.schema.buckets) {
            obj = await trx.bucket(bucket.short).readOne(msg.id);
            if (obj) {
                bucketUsed = bucket; 
                break;
            }
        }
        if (!obj) {
            throw NesoiError.Machine.ObjNotFound(this.schema.alias, msg.id);
        }

        // Get current state
        const stateName = obj[this.schema.stateField] as string;
        if (!stateName) {
            throw NesoiError.Machine.StateNotFound(this.schema.alias, msg.id);
        }
        const state = this.schema.states[stateName];
        if (!state) {
            throw NesoiError.Machine.StateNotFound(this.schema.alias, msg.id);
        }

        MachineOutput.add(output, 
            MachineOutputEntry.info_msg_received(msg, state.name, obj));

        // Find list of transitions for given state and message
        const transitions = this.schema.transitions.from[stateName]?.[msg.$];
        if (!transitions?.length) {
            MachineOutput.add(output, 
                MachineOutputEntry.warn_no_transition_found(state.name, msg.$))
            return { obj, output }
        }

        const queue: Message<any>[] = [];

        // Run "beforeLeave" job of current state
        await this.runStateJob(trx, output, queue,
            state.jobs.beforeLeave,
            msg,
            obj,
            state.name,
            undefined,
            'before_leave',
            `Ran job '${state.jobs.beforeLeave?.name}' before leaving '${state.name}'`)

        // Try each transition until one works
        let nextState: $MachineState | undefined;
        let nextMsg: Message<any> | undefined;
        for (const transition of transitions) {
            
            // Transition condition [ .if() ]
            if (transition.condition) {
                const ctx = { trx, msg, obj };
                const conditionResult = await transition.condition(ctx);

                // Condition not met, save message as info and try next transition
                if (conditionResult !== true) {
                    MachineOutput.add(output,
                        MachineOutputEntry.info_unmet_condition(transition.name, conditionResult));
                    continue;
                }
            }
            
            // Condition passed, run this transition
            // Get next state
            const nextStateName = transition.to;
            nextState = this.schema.states[nextStateName];
            if (!state) {
                throw NesoiError.Machine.StateNotFound(this.schema.alias, msg.id);
            }

            // Run all transition jobs
            for (const job of transition.jobs) {
                await TrxNode.jobWithCustomCtx(trx, job.short, {
                    obj,
                    from: state.name,
                    to: nextState.name
                }).forward(msg) as any;
                MachineOutput.add(output, 
                    MachineOutputEntry.info_job_from_transition(job.full, transition.name))
            }

            // Run "beforeEnter" job of next state
            await this.runStateJob(trx, output, queue,
                nextState.jobs.beforeEnter,
                msg,
                obj,
                state.name,
                nextState.name,
                'before_enter',
                `Ran job '${nextState.jobs.beforeEnter?.name}' before entering '${nextState.name}'`)

            // Change object state to new state and save
            // TODO: log object changes
            obj[this.schema.stateField] = nextState.name;
            if (this.schema.stateAliasField) {
                obj[this.schema.stateAliasField] = nextState.alias;
            }
            obj = await trx.bucket(bucketUsed.short).patch(obj as any);
            if (nextStateName !== stateName) {
                MachineOutput.add(output,
                    MachineOutputEntry.info_state_changed(state.name, nextState.name));
            }
            else {
                MachineOutput.add(output,
                    MachineOutputEntry.info_state_not_changed(state.name));
            }

            // Run "afterLeave" job of previous state (which was the current until now)
            await this.runStateJob(trx, output, queue,
                state.jobs.afterLeave,
                msg,
                obj,
                state.name,
                state.name,
                'after_leave',
                `Ran job '${state.jobs.afterLeave?.name}' after leaving '${state.name}'`)

            // Run "afterEnter" job of current state (which was the next until now)
            await this.runStateJob(trx, output, queue,
                nextState.jobs.afterEnter,
                msg,
                obj,
                state.name,
                nextState.name,
                'after_enter',
                `Ran job '${nextState.jobs.afterEnter?.name}' after entering '${nextState.name}'`)
            
            break;
        }

        // No transition run, 
        if (!nextState) {
            MachineOutput.add(output,
                MachineOutputEntry.warn_no_transition_run(state.name))
        }

        // TODO: queue nextMsg
        if (nextMsg) {
            // ...
        }

        return { obj, output };
    }

    private async runStateJob(
        trx: AnyTrxNode,
        output: MachineOutput,
        queue: Message<any>[],
        job: Tag | undefined,
        msg: Message<any>,
        obj: Record<string, any>,
        from: string,
        to: string | undefined,
        code: string,
        text: string
    ) {
        if (!job) { return }

        const result = await TrxNode.jobWithCustomCtx(trx, job.short, {
            obj,
            from,
            to
        }).forward(msg);

        MachineOutput.add(output,
            MachineOutputEntry.info_job_from_state(job.full, from));

        if (result instanceof Message) {
            queue.push(result);
            MachineOutput.add(output,
                MachineOutputEntry.info_job_returned_message(job.full, result))
        }
    }
}

export type AnyMachine = Machine<any, any, any>