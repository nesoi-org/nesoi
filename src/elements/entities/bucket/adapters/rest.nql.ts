import { NQL_Result, NQLRunner } from '../query/nql_engine';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NQL_Pagination, NQL_Part } from '../query/nql.schema';
import { AnyRESTBucketAdapter } from './rest.bucket_adapter';
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

    async run(trx: AnyTrxNode, part: NQL_Part, params: Obj[], param_templates: Record<string, string>[], pagination?: NQL_Pagination, view?: any, serialize?: boolean) {
        if (!this.adapter) {
            throw new Error('No adapter bound to NQL Runner')
        }
        const query = NQL_Decompiler.decompile(part, params, param_templates);
        const res = await this.adapter.fetch(trx, '/query', {
            method: 'POST',
            body: JSON.stringify({
                query,
                page: pagination?.page,
                perPage: pagination?.perPage,
            })
        });
        return res.data as NQL_Result;
    }
}