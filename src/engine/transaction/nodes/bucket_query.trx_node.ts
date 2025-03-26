import { $Module, ViewName, ViewObj } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { NesoiError } from '~/engine/data/error';
import { NQL_AnyQuery, NQL_Pagination, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';

export class BucketQueryTrxNode<
    M extends $Module,
    B extends $Bucket,
    V extends ViewName<B>,
    Obj = ViewObj<B, V>
> {

    constructor(
        private trx: TrxNode<any, M, any>,
        private bucket: Bucket<M, B>,
        private query: NQL_AnyQuery,
        private view: V
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
            results = await this.bucket.query(this.trx, this.query, undefined, this.view);
        }
        catch (e) {
            await TrxNode.error(this.trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(this.trx, { length: results.length });
        return results.length
            ? results[0] as Obj
            : undefined;
    }
    
    public async firstOrFail(): Promise<Obj> {
        await TrxNode.open(this.trx, 'queryFirstOrFail', { schema: this.query, view: this.view });

        let results;
        try {
            results = await this.bucket.query(this.trx, this.query, undefined, this.view);
        }
        catch (e) {
            await TrxNode.error(this.trx, e); // Bucket unexpected error
            throw e;
        }

        if (!results.length) {
            const e = NesoiError.Bucket.Query.NoResults({ bucket: this.bucket.schema.alias, query: this.query as any });
            await TrxNode.error(this.trx, e);
            throw e;
        }

        await TrxNode.ok(this.trx, { length: results.length });
        return results[0] as Obj
    }

    public async all(): Promise<Obj[]> {
        await TrxNode.open(this.trx, 'queryAll', { schema: this.query, view: this.view });

        let results;
        try {
            results = await this.bucket.query(this.trx, this.query, undefined, this.view);
        }
        catch (e) {
            await TrxNode.error(this.trx, e); // Bucket unexpected error
            throw e;
        }
        
        await TrxNode.ok(this.trx, { length: results.length });
        return results as Obj[];
    }

    public async page(pagination: NQL_Pagination): Promise<Obj[]> {
        await TrxNode.open(this.trx, 'queryPage', { schema: this.query, pagination, view: this.view });

        let results;
        try {
            results = await this.bucket.query(this.trx, this.query, pagination, this.view);
        }
        catch (e) {
            await TrxNode.error(this.trx, e); // Bucket unexpected error
            throw e;
        }
        
        await TrxNode.ok(this.trx, { length: results.length });
        return results as Obj[];
    }
}