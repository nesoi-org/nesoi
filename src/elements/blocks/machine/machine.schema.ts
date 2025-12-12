import type { $BlockAuth, Tag, $JobAssert, $MachineStates, $MachineTransitions, $MachineLogFn } from 'index';
import { $Block } from '~/elements/blocks/block.schema';

// Transition

/**
 * @category Schemas
 * @subcategory Block
 */
export class $MachineTransition extends $Block {
    public $t = 'machine.transition' as const;
    
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

// State

/**
 * @category Schemas
 * @subcategory Block
 */
export class $MachineState extends $Block {
    public $t = 'machine.state' as const;
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