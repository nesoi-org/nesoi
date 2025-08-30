import { $Block, $BlockOutput } from '../block.schema';
import { JobExtrasAndAsserts } from './job.builder';
import { $ResourceJobScope } from './internal/resource_job.schema';
import { $MachineJobScope } from '../machine/machine.schema';
import { Tag } from '~/engine/dependency';

export type $JobAssert<Trx, Message, Extra = {}, Ctx = {}> = 
    $JobMethod<Trx, Message, string | true, Extra, Ctx>

export type $JobMethod<Trx, Message, O, Extra = never, Ctx = {}> =
    (ctx: {
        trx: Trx,
        msg: Message,
        extra: Extra,
        job: $Job
    } & Ctx) => O | Promise<O>

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
        public authn: string[],
        public input: Tag[],
        public output: $BlockOutput | undefined,
        public extrasAndAsserts: JobExtrasAndAsserts,
        public method: $JobMethod<any, any, any, any>,
        public scope?: $MachineJobScope | $ResourceJobScope
    ) {
        super(module, name, alias, authn, input, output);
    }
}