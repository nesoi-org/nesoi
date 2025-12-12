import type { BucketAdapterConfig } from './bucket_adapter';
import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { BucketCacheSync } from '../cache/bucket_cache';

import { BucketAdapter } from './bucket_adapter';
import { RESTNQLRunner } from './rest.nql';
import { Log } from '~/engine/util/log';

export type RESTBucketAdapterConfig = {
    base_url: string,
    auth?: string
}

/**
 * @category Adapters
 * @subcategory Entity
 * */
export class RESTBucketAdapter<
    B extends $Bucket,
    Obj extends B['#data']
> extends BucketAdapter<Obj, RESTBucketAdapterConfig & BucketAdapterConfig> {
    
    constructor(
        public schema: B,
        config?: RESTBucketAdapterConfig
    ) {
        const nql = new RESTNQLRunner();
        super(schema, nql, config);
        nql.bind(this);
    }

    getQueryMeta() {
        return {
            scope: `rest.${this.schema.name}`,
            avgTime: 10
        };
    }

    /*
        Fetch
    */

    async fetch(trx: AnyTrxNode, url: string, options?: RequestInit) {
        const token = this.config.auth
            ? await trx.token(this.config.auth)
            : undefined;
        
        const input = this.config.base_url + url;
        
        return fetch(input, {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: token ? `Bearer ${token}` : undefined,
            }
        })
            .then(async response => ({
                status: response.status,
                headers: response.headers,
                body: await response.json().catch(() => null)
            }))
            .then((response) => {
                // if (response.status === 401) {
                //     // ...
                // }
                return response.body as { data: Obj | Obj[] }
            })
            .catch((e) => {
                Log.error('rest', '', e, e);
                // ...
                throw e
            })
    }


    /* Dangerous, used on cache only */

    protected async deleteEverything(trx: AnyTrxNode) {
        throw new Error('Not implemented');
    }

    /* Read operations */

    async index(trx: AnyTrxNode): Promise<Obj[]> {
        const res = await this.fetch(trx, '/', {
            method: 'GET'
        });
        return res.data as Obj[];
    }

    async get(trx: AnyTrxNode, id: Obj['id']): Promise<Obj | undefined> {
        const res = await this.fetch(trx, '/'+id, {
            method: 'GET'
        });
        return res.data as Obj;
    }

    /* Write Operations */

    async create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await this.fetch(trx, '/', {
            method: 'POST',
            body: JSON.stringify(obj)
        });
        return res.data as Obj;
    }

    async createMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const out: any[] = [];
        for (const obj of objs) {
            out.push(await this.create(trx, obj))
        }
        return out;
    }

    async replace(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        if (!obj.id) {
            throw new Error(`Object with id ${obj.id} not found for replace`)
        }
        const host_obj = await this.get(trx, obj.id);
        if (!host_obj) {
            throw new Error(`Object with id ${obj.id} not found for replace`)
        }
        const res = await this.fetch(trx, '/'+obj.id, {
            method: 'PUT',
            body: JSON.stringify(obj)
        });
        return res.data as Obj;
    }

    async replaceMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const out: any[] = [];
        for (const obj of objs) {
            const output = await this.replace(trx, obj);
            out.push(output);
        }
        return Promise.resolve(out);
    }
    
    async patch(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await this.fetch(trx, '/'+obj.id, {
            method: 'PATCH',
            body: JSON.stringify(obj)
        });
        return res.data as Obj;
    }

    async patchMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const out: any[] = [];
        for (const obj of objs) {
            const output = await this.patch(trx, obj); 
            out.push(output);
        }
        return Promise.resolve(out);
    }

    async put(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await this.fetch(trx, '/'+obj.id, {
            method: 'PUT',
            body: JSON.stringify(obj)
        });
        return res.data as Obj;
    }

    async putMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const out: any[] = [];
        for (const obj of objs) {
            const output = await this.put(trx, obj); 
            out.push(output);
        }
        return Promise.resolve(out);
    }

    async delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<void> {
        await this.fetch(trx, '/'+id, {
            method: 'DELETE'
        });
    }

    async deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<void> {
        for (const id of ids) {
            await this.delete(trx, id);
        }
    }

    /* Cache Operations */

    async syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>> {
        // TODO
        return null;
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
    ): Promise<null|'deleted'|BucketCacheSync<Obj>[]> {
        // TODO
        return null
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
    ): Promise<null|{
        sync: BucketCacheSync<Obj>[],
        hash: string,
        updateEpoch: number,
        reset: boolean
    }> {
        // TODO
        return null
        // // 1. Hash the current ids
        // const idStr = Object.keys(this.data).sort().join('');
        // const hash = Hash.string(idStr);

        // // 2. If hash changed, return a reset sync with all objects
        // if (hash !== lastHash) {
        //     let updateEpoch = 0;
        //     const sync = (Object.values(this.data) as Obj[])
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
}

export type AnyRESTBucketAdapter = RESTBucketAdapter<any, any>