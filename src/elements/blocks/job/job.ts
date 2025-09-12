import { $Module, $Space } from '~/schema';
import { $Job } from './job.schema';
import { Block } from '../block';
import _Promise from '~/engine/util/promise';
import { AnyMessage, Message } from '~/elements/entities/message/message';
import { Module } from '~/engine/module';
import { TrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Elements
 * @subcategory Block
 */
export class Job<
    S extends $Space,
    M extends $Module,
    $ extends $Job
> extends Block<S,M,$> {
    
    constructor(
        public module: Module<S, M>,
        public schema: $
    ) {
        super('job', module, schema);
    }

    protected async run(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage, _ctx: Record<string, any> = {}): Promise<$['#output']> {

        // Check authentication
        await TrxNode.checkAuth(trx, this.schema.auth);

        const _msg = Message.clone(msg);
        const extra: Record<string, any> = {};
        const ctx = { trx, msg: _msg, extra, job: this.schema };
        Object.assign(ctx, _ctx);

        for (const i in this.schema.extrasAndAsserts) {

            const def = this.schema.extrasAndAsserts[i];

            // Extra
            if ('extra' in def) {
                const extraInput = await _Promise.solve(
                    def.extra(ctx)
                );
                Object.assign(extra, extraInput);
            }

            // Condition
            else {
                const condValue = await _Promise.solve(
                    def.assert(ctx)
                );
                if (condValue !== true) {
                    throw NesoiError.Job.ConditionUnmet({ job: this.schema.alias, error: condValue });
                }
            }

        }

        return this.schema.method(ctx);
    }

}

export type AnyJob = Job<any, any, any>