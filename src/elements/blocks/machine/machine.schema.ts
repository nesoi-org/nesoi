import type { $BlockAuth } from '~/elements/blocks/block.schema';
import type { $JobAssert } from '~/elements/blocks/job/job.schema';
import type { Tag } from '~/engine/dependency';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { MachineOutput } from './machine';

import { $Block } from '~/elements/blocks/block.schema';

// Transition

/**
 * @category Schemas
 * @subcategory Block
 */
export class $MachineTransition extends $Block {
    public $t = 'machine.transition' as any;
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public msg: Tag,
        
        public from: string,
        public to: string,
        public condition?: $JobAssert<any, any, never, any>,
        public jobs: Tag[] = []
    ) {
        super(module, name, alias, auth, [msg], {});
    }
}

export type $MachineTransitions = {
    from: {
        [state: string]: {
            [msg: string]: $MachineTransition[]
        }
    },
    to: {
        [state: string]: {
            [msg: string]: $MachineTransition[]
        }
    }
}

// State

/**
 * @category Schemas
 * @subcategory Block
 */
export class $MachineState extends $Block {
    public $t = 'machine.state' as any;
    public '#input.enter': any
    public '#input.leave': any

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public initial: boolean,
        public final: boolean,
        public inputEnter: Tag[],
        public inputLeave: Tag[],

        public jobs: {
            beforeEnter?: Tag
            afterEnter?: Tag
            beforeLeave?: Tag
            afterLeave?: Tag
        }
    ) {
        super(module, name, alias, auth, [...inputEnter, ...inputLeave], {});
    }
}

export type $MachineStates = {
    [x: string]: $MachineState 
}

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Machine extends $Block {
    public $t = 'machine' as const;
    public '#data'!: unknown;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: Tag[],

        public buckets: Tag[],
        public jobs: Tag[],
        public stateField: string,
        public states: $MachineStates,
        public transitions: $MachineTransitions,
        public stateAliasField?: string,
        
        public logger?: $MachineLogFn<any>
    ) {
        super(module, name, alias, auth, input, {});
    }

}


/**
 * @category Schemas
 * @subcategory Block
 */
export class $MachineJobScope {
    constructor(
        public module: string,
        public machine: string
    ) {}
}

// Logger


export type $MachineLogFn<M extends $Machine = $Machine> = (
    ctx: { trx: AnyTrxNode, schema: M, obj: M['#data'], output: MachineOutput }
) => any | Promise<any>