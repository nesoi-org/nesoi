import { $Bucket } from '~/elements';
import { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { Log } from '~/engine/util/log';
import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import postgres from 'postgres'
import { Trx } from '~/engine/transaction/trx';
import { NQL_QueryMeta } from '~/elements/entities/bucket/query/nql.schema';
import { PostgresProvider } from './postgres.provider';

export class PostgresBucketAdapter<
    $ extends $Bucket,
    Obj extends $['#data']
> extends BucketAdapter<$['#data']> {


    constructor(
        public schema: $,
        public provider: PostgresProvider,
        public tableName: string
    ) {
        super(schema, provider.nql, provider.config);
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
            ORDER BY ${this.config.meta.updated_at} DESC
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

    async create(
        trx: AnyTrxNode,
        obj: Record<string, any>
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const keys = Object.keys(this.schema.model.fields)
            .filter(key => obj[key] !== undefined)
            .filter(key => key !== 'id');
        
        // Add meta (created_*/updated_*)
        keys.push(...Object.values(this.config.meta));

        // Create
        const objs = await this.guard(sql)`
            INSERT INTO ${sql(this.tableName)}
            ${ sql(obj, keys) }
            RETURNING *`;
        return objs[0] as Obj;
    }

    async createMany(
        trx: AnyTrxNode,
        objs: Record<string, any>[]
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const keys = Object.keys(this.schema.model.fields)
            .filter(key => key !== 'id');

        // Add meta (created_*/updated_*)
        keys.push(...Object.values(this.config.meta));

        for (const obj of objs) {
            for (const key in obj) {
                if (obj[key] === undefined) {
                    delete obj[key];
                }
            }
        }

        const inserted = await this.guard(sql)`
            INSERT INTO ${sql(this.tableName)}
            ${ sql(objs as Record<string, any>, keys) }
        `;

        return inserted;
    }

    async put(
        trx: AnyTrxNode,
        obj: Record<string, any>
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const keys = Object.keys(this.schema.model.fields)
            .filter(key => obj[key] !== undefined);

        // Add meta (created_*/updated_*)
        const ikeys = keys.concat(...Object.values(this.config.meta));
        const ukeys = keys.concat(this.config.meta.updated_by, this.config.meta.updated_at);
        
        const objs = await this.guard(sql)`
            INSERT INTO ${sql(this.tableName)}
            ${ sql(obj, ikeys) }
            ON CONFLICT(id)
            DO UPDATE ${sql(this.tableName)} SET
            ${ sql(obj, ukeys) }
            RETURNING *
        `;
        return objs[0] as Obj;
    }

    async putMany(
        trx: AnyTrxNode,
        objs: Record<string, any>[]
    ) {
        const _objs: $['#data'][] = []
        for (const obj of objs) {
            _objs.push(await this.put(trx, obj));
        }
        return _objs;
    }

    async patch(
        trx: AnyTrxNode,
        obj: Record<string, any>
    ) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const keys = Object.keys(this.schema.model.fields)
            .filter(key => key in obj)
            .filter(key => obj[key] !== undefined);

        keys.push(this.config.meta.updated_by, this.config.meta.updated_at);
            
        const objs = await this.guard(sql)`
            UPDATE ${sql(this.tableName)} SET
            ${ sql(obj, keys) }
            WHERE id = ${ obj.id }
            RETURNING *
        `;
        return objs[0] as Obj;
    }

    async patchMany(
        trx: AnyTrxNode,
        objs: Record<string, any>[]
    ) {
        const _objs: $['#data'][] = []
        for (const obj of objs) {
            _objs.push(await this.patch(trx, obj));
        }
        return _objs;
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

    public static getTableMeta(trx: AnyTrxNode, meta: NQL_QueryMeta) {
        const bucketName = meta.bucket!.name;
        const bucket = TrxNode.getModule(trx).buckets[bucketName];
        const adapter = bucket.adapter as PostgresBucketAdapter<any, any>;
        
        return {
            tableName: adapter.tableName,
            meta: adapter.config.meta
        }
    }
    

}