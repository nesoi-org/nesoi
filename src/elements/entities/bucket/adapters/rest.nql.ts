import type { NQL_Result} from '../query/nql_engine';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { NQL_Pagination, NQL_Part } from '../query/nql.schema';
import type { AnyRESTBucketAdapter } from './rest.bucket_adapter';

import { NQLRunner } from '../query/nql_engine';
import { NQL_Decompiler } from '../query/nql_compiler';

type Obj = Record<string, any>
type Objs = Record<string, Obj>

/**
 * @category NQL
 * */
export class RESTNQLRunner extends NQLRunner {
    
    protected adapter?: AnyRESTBucketAdapter

    constructor(
    ) {
        super();
    }

    public bind(adapter: AnyRESTBucketAdapter) {
        this.adapter = adapter;
    }

    async run(
        trx: AnyTrxNode,
        part: NQL_Part,
        params: Record<string, any>[],
        options: {
            pagination?: NQL_Pagination,
            param_templates?: Record<string, string>[],
            metadata_only?: boolean
        } = {}
    ) {
        if (!this.adapter) {
            throw new Error('No adapter bound to NQL Runner')
        }
        const query = NQL_Decompiler.decompile(part, params, options.param_templates ?? []);
        const res = await this.adapter.fetch(trx, '/query', {
            method: 'POST',
            body: JSON.stringify({
                query,
                page: options.pagination?.page,
                perPage: options.pagination?.perPage,
            })
        });
        return res.data as NQL_Result;
    }
}