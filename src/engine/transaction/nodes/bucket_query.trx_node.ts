import { $Module, ViewName, ViewObj } from '~/schema';
import { AnyTrxNode, TrxNode } from '../trx_node';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { NesoiError } from '~/engine/data/error';
import { NQL_AnyQuery, NQL_Pagination, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import { NQL_Result } from '~/elements/entities/bucket/query/nql_engine';
import { Tag } from '~/engine/dependency';
import { ExternalTrxNode } from './external.trx_node';

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

    private _params?: Record<string, any>[] = []
    
    private external: boolean
    private bucket?: Bucket<M, B>

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag,
        private query: NQL_AnyQuery,
        private enableTenancy: boolean,
        private view?: V
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.bucket = tag.element(trx);
        }
    }
    
    public merge($: NQL_Query<M,B>): void {
        const and = $['#and'];
        const or = $['#or'];
        delete $['#and'];
        delete $['#or'];
        Object.assign(this.query, $);
        this.query['#and*'] = and as any // TODO: make this a little better
        this.query['#or*'] = or as any // TODO: make this a little better
    }
    
    public params(value?: Record<string, any> | Record<string, any>[]) {
        this._params = value
            ? Array.isArray(value) ? value : [value]
            : [];
        return this;
    }

    /*
        Wrap
    */

    async wrap(
        action: string,
        input: Record<string, any>,
        fn: (trx: AnyTrxNode, element: Bucket<M, B>) => Promise<any>
    ): Promise<{
        data: any[]
    }> {
        const wrapped = async (parentTrx: AnyTrxNode, bucket: Bucket<M, B>) => {
            const trx = TrxNode.makeChildNode(parentTrx, bucket.schema.module, 'bucket', bucket.schema.name);    
            
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, bucket);
            }
            catch (e) {
                throw TrxNode.error(trx, e);
            }
            TrxNode.ok(trx, { length: out.data.length });

            return out;
        }

        if (this.external) {
            const ext = new ExternalTrxNode(this.trx, this.tag)
            return ext.run(
                trx => this.tag.element(trx),
                wrapped
            );
        }
        else {
            return wrapped(this.trx, this.bucket!)
        }
    }
        
    public async first(): Promise<Obj | undefined> {
        const results = await this.wrap('queryFirst', { schema: this.query, view: this.view }, (trx, bucket) => {
            return bucket.query(this.trx, this.query, {
                perPage: 1
            }, this.view, {
                no_tenancy: !this.enableTenancy,
                params: this._params
            })
        })
        return results.data.length
            ? results.data[0] as Obj
            : undefined
    }
    
    public async firstOrFail(): Promise<Obj> {
        const results = await this.wrap('queryFirstOrFail', { schema: this.query, view: this.view }, async (trx, bucket) => {
            const results = await bucket.query(trx, this.query, undefined, this.view, {
                no_tenancy: !this.enableTenancy,
                params: this._params
            });
            if (!results.data.length) {
                throw NesoiError.Bucket.Query.NoResults({ bucket: bucket.schema.alias, query: this.query as any });
            }
            return results
        })
        return results.data[0] as Obj;
    }

    public async all(): Promise<Obj[]> {
        const results = await this.wrap('queryAll', { schema: this.query, view: this.view }, async (trx, bucket) => {
            return bucket.query(trx, this.query, undefined, this.view, {
                params: this._params
            });
        })
        return results.data as Obj[];
    }

    public async page(pagination?: NQL_Pagination): Promise<NQL_Result<Obj>> {
        if (!pagination) {
            const data = await this.all();
            return {
                data, totalItems: data.length
            }
        }

        const results = await this.wrap('queryPage', { schema: this.query, view: this.view }, async (trx, bucket) => {
            return bucket.query(trx, this.query, pagination, this.view, {
                params: this._params
            });
        })
        return results;
    }
}