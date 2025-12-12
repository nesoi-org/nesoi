import type { $BlockAuth, Tag, $BlockOutput, $JobExtrasAndAsserts, $JobMethod, $MachineJobScope, $ResourceJobScope } from 'index';
import { $Block } from '../block.schema';

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Job extends $Block {
    public $t = 'job' as const;
    public '#extra'!: unknown;
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: Tag[],
        public output: $BlockOutput | undefined,
        public extrasAndAsserts: $JobExtrasAndAsserts,
        public method: $JobMethod<any, any, any, any>,
        public scope?: $MachineJobScope | $ResourceJobScope
    ) {
        super(module, name, alias, auth, input, output);
    }
}