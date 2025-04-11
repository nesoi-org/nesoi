import { AnyModule } from '~/engine/module';
import { NQL_CompiledQuery } from './nql_compiler';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { AnyBucket, Bucket } from '../bucket';
import { NQL_Pagination, NQL_Part } from './nql.schema';

type Obj = Record<string, any>

export type NQL_Result<T = Obj> = {
    data: T[]
    count?: number
    page?: number
    perPage?: number
}

export abstract class NQLRunner {

    abstract run(trx: AnyTrxNode, part: NQL_Part, params: Record<string, any>, pagination?: NQL_Pagination): Promise<NQL_Result>

}

export class NQL_Engine {

    private runners: {
        [scope: string]: NQLRunner
    } = {}

    constructor(
        private module: AnyModule
    ) {
        for (const b in module.buckets) {
            const bucket = module.buckets[b];
            const meta = Bucket.getQueryMeta(bucket);
            if (!(meta.scope in this.runners)) {
                this.runners[meta.scope] = Bucket.getQueryRunner(bucket);
            }
        }
    }

    async run(
        trx: AnyTrxNode,
        query: NQL_CompiledQuery,
        pagination?: NQL_Pagination,
        params: Record<string, any> = {}
    ): Promise<NQL_Result> {

        let result: NQL_Result = {
            data: []
        };
        for (let i = 0; i < query.execOrder.length; i++) {
            const part_i = query.execOrder[i];
            const part = query.parts[part_i];

            // Run part
            const runner = this.runners[part.union.meta.scope!];
            const out = await runner.run(trx, part, params, pagination);
            result = out;
            
            // Part failed, return
            // Failure here is only when a single value is expected,
            if (!part.many) {
                if (result.data.length === 0) {
                    return {
                        data: []
                    }
                }
            }

            // Fill part params
            params[`%__${part_i}__%`] = part.many ? result.data : result.data[0];
        }

        return result;
    }

    public linkExternal(bucket: AnyBucket) {
        const meta = Bucket.getQueryMeta(bucket);
        if (!(meta.scope in this.runners)) {
            this.runners[meta.scope] = Bucket.getQueryRunner(bucket);
        }
    }

}