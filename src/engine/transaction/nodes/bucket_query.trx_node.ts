import { $Module, ViewName, ViewObj } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { NesoiError } from '~/engine/data/error';
import { NQL_AnyQuery, NQL_Pagination, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import { NQL_Result } from '~/elements/entities/bucket/query/nql_engine';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketQueryTrxNode<
    M extends $Module,
    B extends $Bucket,
    V extends ViewName<B> | undefined = undefined,
    Obj = V extends string ? ViewObj<B, V> : B['#data']
> {

    constructor(
        private trx: TrxNode<any, M, any>,
        private bucket: Bucket<M, B>,
        private query: NQL_AnyQuery,
        private enableTenancy: boolean,
        private view?: V
    ) {}
    
    public merge($: NQL_Query<M,B>): void {
        const and = $['#and'];
        const or = $['#or'];
        delete $['#and'];
        delete $['#or'];
        Object.assign(this.query, $);
        this.query['#and*'] = and as any // TODO: make this a little better
        this.query['#or*'] = or as any // TODO: make this a little better
    }
    
    public async first(): Promise<Obj | undefined> {
        await TrxNode.open(this.trx, 'queryFirst', { schema: this.query, view: this.view });

        let results;
        try {
            results = await this.bucket.query(this.trx, this.query, {
                perPage: 1
            }, this.view, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            throw await TrxNode.error(this.trx, e); // Bucket unexpected error
        }

        await TrxNode.ok(this.trx, { length: results.data.length });
        return results.data.length
            ? results.data[0] as Obj
            : undefined;
    }
    
    public async firstOrFail(): Promise<Obj> {
        await TrxNode.open(this.trx, 'queryFirstOrFail', { schema: this.query, view: this.view });

        let results;
        try {
            results = await this.bucket.query(this.trx, this.query, undefined, this.view, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            throw await TrxNode.error(this.trx, e); // Bucket unexpected error
        }

        if (!results.data.length) {
            const e = NesoiError.Bucket.Query.NoResults({ bucket: this.bucket.schema.alias, query: this.query as any });
            throw await TrxNode.error(this.trx, e);
        }

        await TrxNode.ok(this.trx, { length: results.data.length });
        return results.data[0] as Obj
    }

    public async all(): Promise<Obj[]> {
        await TrxNode.open(this.trx, 'queryAll', { schema: this.query, view: this.view });

        let results;
        try {
            results = await this.bucket.query(this.trx, this.query, undefined, this.view);
        }
        catch (e) {
            throw await TrxNode.error(this.trx, e); // Bucket unexpected error
        }
        
        await TrxNode.ok(this.trx, { length: results.data.length });
        return results.data as Obj[];
    }

    public async page(pagination?: NQL_Pagination): Promise<NQL_Result<Obj>> {
        if (!pagination) {
            return {
                data: await this.all()
            }
        }

        await TrxNode.open(this.trx, 'queryPage', { schema: this.query, pagination, view: this.view });

        let result: NQL_Result<Obj>;
        try {
            result = await this.bucket.query(this.trx, this.query, pagination, this.view);
        }
        catch (e) {
            throw await TrxNode.error(this.trx, e); // Bucket unexpected error
        }
        
        await TrxNode.ok(this.trx, { length: result.data.length });
        return result;
    }
}