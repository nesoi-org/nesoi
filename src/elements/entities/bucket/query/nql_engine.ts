import { AnyModule } from '~/engine/module';
import { NQL_CompiledQuery } from './nql_compiler';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { AnyBucket } from '../bucket';
import { NQL_Pagination, NQL_Part } from './nql.schema';
import { $BucketView } from '../view/bucket_view.schema';

type Obj = Record<string, any>

export type NQL_Result<T = Obj> = {
    data: T[]
    totalItems?: number
    page?: number
    perPage?: number
}

/**
 * @category NQL
 * */
export abstract class NQLRunner {

    abstract run(trx: AnyTrxNode, part: NQL_Part, params: Record<string, any>[], param_templates: Record<string, string>[], pagination?: NQL_Pagination, view?: $BucketView, serialize?: boolean): Promise<NQL_Result>

}

/**
 * @category NQL
 * */
export class NQL_Engine {

    private runners: {
        [scope: string]: NQLRunner
    } = {}

    constructor(
        private module: AnyModule
    ) {
        for (const b in module.buckets) {
            const bucket = module.buckets[b];
            const meta = bucket.getQueryMeta();
            if (!(meta.scope in this.runners)) {
                this.runners[meta.scope] = bucket.adapter.nql;
            }
        }
    }

    async run(
        trx: AnyTrxNode,
        query: NQL_CompiledQuery,
        pagination?: NQL_Pagination,
        params: Record<string, any>[] = [{}],
        param_templates: Record<string, string>[] = [],
        view?: $BucketView,
        customBuckets?: Record<string, {
            scope: string
            nql: NQLRunner
        }>,
        serialize?: boolean
    ): Promise<NQL_Result> {
        if (!params.length) params = [{}];

        let result: NQL_Result = {
            data: []
        };
        for (let i = 0; i < query.execOrder.length; i++) {
            const part_i = query.execOrder[i];
            const part = query.parts[part_i];

            // Run part
            const _runner =
                Object.values(customBuckets || {}).find(b => b.scope === part.union.meta.scope)?.nql
                || this.runners[part.union.meta.scope!];

            const out = await _runner.run(trx, part, params, param_templates, pagination, view, serialize);
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
            for (const paramGroup of params) {
                paramGroup[`%__${part_i}__%`] = part.many ? result.data : result.data[0];
            }
        }

        return result;
    }

    public linkExternal(bucket: AnyBucket) {
        const meta = bucket.getQueryMeta();
        if (!(meta.scope in this.runners)) {
            this.runners[meta.scope] = bucket.adapter.nql;
        }
    }

}