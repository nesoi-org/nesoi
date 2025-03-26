import { $Bucket } from '~/elements';
import { BucketAdapter, BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { Log } from '~/engine/util/log';
import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import postgres from 'postgres'
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { Decimal } from '~/engine/data/decimal';
import { PostgresNQLRunner } from './postgres.nql';
import { AnyTrx, Trx } from '~/engine/transaction/trx';
import { TrxEngineWrapFn } from '~/engine/transaction/trx_engine.config';
import { AnyBucket } from '~/elements/entities/bucket/bucket';
import { NQL_QueryMeta } from '~/elements/entities/bucket/query/nql.schema';

export type PostgresBucketAdapterConfig = BucketAdapterConfig & {
    postgres?: postgres.Options<any>
}

export class PostgresProvider {

    public static make<
        Name extends string
    >(name: Name, config?: PostgresBucketAdapterConfig) {
        return {
            name: name,
            up: () => new PostgresProvider(config),
            down: () => {}
        }
    }

    public sql: postgres.Sql<any>
    public nql: PostgresNQLRunner

    public constructor(
        public config?: PostgresBucketAdapterConfig
    ) {
        Log.info('postgres' as any, 'provider', 'Connecting to Postgres database')
        this.sql = postgres({
            ...(config?.postgres || {}),
            debug: true,
            types: {
                char: {
                    to        : 1042,
                    from      : [1042],
                    serialize : (val: string) => val.trim(),
                    parse     : (val: string) => val.trim()
                },
                date: {
                    to        : 1082,
                    from      : [1082],
                    serialize : (val: NesoiDate) => val.toISO(),
                    parse     : (val: string) => NesoiDate.fromISO(val)
                },
                datetime: {
                    to        : 1114,
                    from      : [1114],
                    serialize : (val: NesoiDatetime) => val.toISO(),
                    parse     : (val: string) => NesoiDatetime.fromISO(val.replace(' ','T')+'Z')
                },
                decimal: {
                    to        : 1700,
                    from      : [1700],
                    serialize : (val: Decimal) => val.toString(),
                    parse     : (val: string) => new Decimal(val)
                }
            }
        })
        this.nql = new PostgresNQLRunner();
    }

    public static wrap(provider: string) {
        return (trx: AnyTrx, fn: TrxEngineWrapFn<any, any>, providers: Record<string, any>) => {
            const postgres = providers[provider].sql as postgres.Sql<any>;
            return postgres.begin(sql => {
                Trx.set(trx.root, 'sql', sql);
                return fn(trx.root);
            })
        }
    }
}

export class PostgresBucketAdapter<
    $ extends $Bucket,
    Obj extends $['#data']
> extends BucketAdapter<$['#data']> {


    constructor(
        public schema: $,
        public provider: PostgresProvider,
        public tableName: string,
        config?: PostgresBucketAdapterConfig
    ) {
        super(schema, provider.nql, config || provider.config);
    }

    private guard(sql: postgres.Sql<any>) {
        return (template: TemplateStringsArray, ...params: readonly any[]) => {
            return sql.call(sql, template, ...params).catch(e => {
                Log.error('bucket', 'postgres', e.toString(), e);
                throw new Error('Database error.');
            }) as unknown as Obj[];
        }
    }

    getQueryMeta() {
        return {
            scope: 'PG',
            avgTime: 50
        }
    }

    /* Dangerous, not implemented. */

    protected deleteEverything(trx: AnyTrxNode) {
        throw new Error('Unsafe operation.')
        return Promise.resolve();
    }

    /* Read operations */

    async index(trx: AnyTrxNode) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const objs = await this.guard(sql)`
            SELECT *
            FROM ${sql(this.tableName)}
        `;
        return objs;
    }

    async get(trx: AnyTrxNode, id: Obj['id']) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const objs = await this.guard(sql)`
            SELECT *
            FROM ${sql(this.tableName)}
            WHERE id = ${ id }
        `;
        return objs[0];
    }

    /* Write Operations */

    async put(
        trx: AnyTrxNode,
        obj: Record<string, any>
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const keys = Object.keys(this.schema.model.fields)
            .filter(key => obj[key] !== undefined);
            
        // Create
        if (!obj.id) {
            const objs = await this.guard(sql)`
                INSERT INTO ${sql(this.tableName)}
                ${ sql(obj, keys) }
                RETURNING *`;
            return objs[0] as Obj;
        }
        // Update (Replace)
        else {
            const objs = await this.guard(sql)`
                UPDATE ${sql(this.tableName)} SET
                ${ sql(obj, keys) }
                WHERE id = ${ obj.id }
                RETURNING *
            `;
            return objs[0] as Obj;
        }
    }

    async putMany(
        trx: AnyTrxNode,
        objs: Record<string, any>[]
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const keys = Object.keys(this.schema.model.fields);

        for (const obj of objs) {
            for (const key in obj) {
                if (obj[key] === undefined) {
                    delete obj[key];
                }
            }
        }

        const insert = objs.filter(obj => !obj.id);
        const update = objs.filter(obj => !!obj.id);

        let inserted: Obj[] = [];
        if (insert.length) {
            const ikeys = keys.filter(key => key !== 'id');
            inserted = await this.guard(sql)`
                INSERT INTO ${sql(this.tableName)}
                ${ sql(objs as Record<string, any>, ikeys) }
            `;
        }
        const updated: Obj[] = [];
        if (update.length) {
            throw new Error('Not implemented yet.')
        }

        return [...inserted, ...updated];
    }

    async delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        await this.guard(sql)`
            DELETE FROM ${sql(this.tableName)}
            WHERE id = ${ id }
        `;
    }

    async deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        await this.guard(sql)`
            DELETE FROM ${sql(this.tableName)}
            WHERE id IN ${ ids }
        `;
    }

    /* Cache Operations */

    async syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ) {
        throw new Error('Not implemented yet.')
        return {} as any;
        // // 1. Check if object was deleted
        // const obj = await this.get(trx, id);
        // if (!obj) {
        //     return 'deleted' as const;
        // }

        // // 2. Check if object was updated
        // const updateEpoch = this.getUpdateEpoch(obj);

        // const hasObjUpdated = updateEpoch > lastObjUpdateEpoch;
        // if (!hasObjUpdated) {
        //     return null;
        // }

        // // 3. Return updated object and epoch
        // return {
        //     obj,
        //     updateEpoch
        // };
    }

    async syncOneAndPast(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastUpdateEpoch: number
    ) {
        throw new Error('Not implemented yet.')
        return {} as any;
        // // 1. Check if object was deleted
        // const obj = await this.get(trx, id);
        // if (!obj) {
        //     return 'deleted' as const;
        // }

        // // 2. Check if object was updated
        // const objUpdateEpoch = this.getUpdateEpoch(obj);
        // const hasObjUpdated = objUpdateEpoch > lastUpdateEpoch;       
        // if (!hasObjUpdated) {
        //     return null;
        // }

        // // 3. Return all objects updated and the max epoch
        // let updateEpoch = 0;
        // const changed = (Object.values(this.data) as Obj[])
        //     .map(obj => {
        //         const epoch = this.getUpdateEpoch(obj);
        //         if (epoch > updateEpoch) {
        //             updateEpoch = epoch;
        //         }
        //         return { obj, updateEpoch: epoch };
        //     })
        //     .filter(obj => obj.updateEpoch > lastUpdateEpoch);

        // if (!changed.length) {
        //     return null;
        // }

        // return changed;
    }

    async syncAll(
        trx: AnyTrxNode,
        lastHash?: string,
        lastUpdateEpoch = 0
    ) {
        throw new Error('Not implemented yet.')
        return {} as any;
        // // 1. Hash the current ids
        // const idStr = Object.keys(this.data).sort().join('');
        // const hash = createHash('md5').update(idStr).digest('hex');
        

        // // 2. If hash changed, return a reset sync with all objects
        // if (hash !== lastHash) {
        //     let updateEpoch = 0;
        //     const sync = (await this.index(trx) as Obj[])
        //         .map(obj => {
        //             const epoch = this.getUpdateEpoch(obj);
        //             if (epoch > updateEpoch) {
        //                 updateEpoch = epoch;
        //             }
        //             return { obj, updateEpoch: epoch };
        //         });
        //     return {
        //         sync,
        //         hash,
        //         updateEpoch,
        //         reset: true
        //     };
        // }

        // // 3. Find the data that changed and return it
        // let updateEpoch = 0;
        // const sync = (Object.values(this.data) as Obj[])
        //     .map(obj => {
        //         const epoch = this.getUpdateEpoch(obj);
        //         if (epoch > updateEpoch) {
        //             updateEpoch = epoch;
        //         }
        //         return { obj, updateEpoch: epoch };
        //     })
        //     .filter(obj => obj.updateEpoch > lastUpdateEpoch);
        
        // if (!sync.length) {
        //     return null;
        // }

        // return {
        //     sync,
        //     hash,
        //     updateEpoch,
        //     reset: false
        // };
    }

    public static getTableName(trx: AnyTrxNode, meta: NQL_QueryMeta) {
        const bucketName = meta.bucket!.name;
        const bucket = TrxNode.getModule(trx).buckets[bucketName];
        const adapter = (bucket as any).adapter as AnyBucket['adapter'] as PostgresBucketAdapter<any, any>;
        return adapter.tableName;
    }
    

}