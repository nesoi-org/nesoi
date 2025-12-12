import type { Bucket } from '~/elements/entities/bucket/bucket';
import type { NQL_Pagination, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import type { NQL_Result } from '~/elements/entities/bucket/query/nql_engine';

import { TrxNode } from '../trx_node';
import { NesoiError } from '~/engine/data/error';
import { Tag } from '~/engine/dependency';
import { ExternalTrxNode } from './external.trx_node';
import type { ViewName } from '~/schema';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketQueryTrxNode<
    M extends $Module,
    B extends $Bucket,
    V extends ViewName<B> | undefined = undefined,
    Obj = B['#data']
> {

    private _params?: Record<string, any>[] = []
    private _indexes?: string[][] = []
    
    private _serialize = false;
    private _metadata_only = false;
    private _no_tenancy = false;

    private external: boolean
    private bucket?: Bucket<M, B>
    private _view?: V

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag,
        private query: NQL_AnyQuery,
        private enableTenancy: boolean,
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.bucket = Tag.element(tag, trx);
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

    public view<View extends ViewName<B>>(view: View): NoInfer<BucketQueryTrxNode<M, B, View, B['views'][View]['#data']>> {
        this._view = view as any;
        return this as never;
    }
    
    public serialize(value?: boolean) {
        if (value) {
            this._serialize = true;
        }
        return this;
    }
    
    public metadata_only(value?: boolean) {
        if (value) {
            this._metadata_only = true;
        }
        return this;
    }

    public no_tenancy(value?: boolean) {
        if (value) {
            this._no_tenancy = true;
        }
    }
    
    public params(value?: Record<string, any> | Record<string, any>[]) {
        this._params = value
            ? Array.isArray(value) ? value : [value]
            : [];
        return this;
    }
    
    public indexes(value?: string[] | string[][]) {
        this._indexes = (value
            ? Array.isArray(value[0]) ? value : [value]
            : undefined) as string[][] | undefined;
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
            const ext = new ExternalTrxNode(this.trx, this.tag, true)
            return ext.run(
                trx => Tag.element(this.tag, trx),
                wrapped
            );
        }
        else {
            return wrapped(this.trx, this.bucket!)
        }
    }
        
    public async first(): Promise<Obj | undefined> {
        const results = await this.wrap('queryFirst', { schema: this.query, view: this._view }, (trx, bucket) => {
            return bucket.query(trx, this.query, this._params, {
                metadata_only: this._metadata_only,
                serialize: this._serialize,
                no_tenancy: !this.enableTenancy,
                indexes: this._indexes
            })
        })
        return results.data.length
            ? results.data[0] as Obj
            : undefined
    }
    
    public async firstOrFail(): Promise<Obj> {
        const results = await this.wrap('queryFirstOrFail', { schema: this.query, view: this._view }, async (trx, bucket) => {
            const results = await bucket.query(trx, this.query, this._params, {
                view: this._view,
                metadata_only: this._metadata_only,
                serialize: this._serialize,
                indexes: this._indexes,
                no_tenancy: this._no_tenancy,
            });
            if (!results.data.length) {
                throw NesoiError.Bucket.Query.NoResults({ bucket: bucket.schema.alias, query: this.query as any });
            }
            return results
        })
        return results.data[0] as Obj;
    }

    public async all(): Promise<Obj[]> {
        const results = await this.wrap('queryAll', { schema: this.query, view: this._view }, async (trx, bucket) => {
            return bucket.query(trx, this.query, this._params, {
                view: this._view,
                metadata_only: this._metadata_only,
                serialize: this._serialize,
                indexes: this._indexes,
                no_tenancy: this._no_tenancy,
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

        const results = await this.wrap('queryPage', { schema: this.query, view: this._view }, async (trx, bucket) => {
            return bucket.query(trx, this.query, this._params, {
                view: this._view,
                metadata_only: this._metadata_only,
                serialize: this._serialize,
                indexes: this._indexes,
                no_tenancy: this._no_tenancy,
                pagination
            });
        })
        return results;
    }
}