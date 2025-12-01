import type { BucketAdapterConfig } from './bucket_adapter';
import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { $Bucket } from '~/elements';
import type { BucketCacheSync } from '../cache/bucket_cache';

import { BucketAdapter } from './bucket_adapter';
import { MemoryNQLRunner } from './memory.nql';
import { Hash } from '~/engine/util/hash';
import { BucketModel } from '../model/bucket_model';

/**
 * @category Adapters
 * @subcategory Entity
 * 
 * > Every method that alters data makes a `Deep.copy` of the input
 * > before processing it, to avoid side-effects to the input data
 * > by modifying the external data on the adapter.
 * > It also makes a `Deep.copy` of the data before outputting it,
 * > to avoid side-effects on the adapter data by modifying the returned
 * > object externally.
 * */
export class MemoryBucketAdapter<
    B extends $Bucket,
    Obj extends B['#data']
> extends BucketAdapter<Obj> {
    
    protected model: BucketModel<any, B>

    constructor(
        public schema: B,
        public data: NoInfer<Record<Obj['id'], Obj>> = {} as any,
        config?: BucketAdapterConfig
    ) {
        const nql = new MemoryNQLRunner();
        super(schema, nql, config);
        nql.bind(this.data);

        this.model = new BucketModel(schema, config)
    }

    getQueryMeta() {
        // Each memory bucket adapter has a different scope,
        // which guarantees sub-queries are run on
        // separate NQLRunners.
        return {
            scope: `${this.schema.module}::${this.schema.name}`,
            avgTime: 10
        };
    }

    /* Dangerous, used on cache only */

    protected deleteEverything(trx: AnyTrxNode) {
        this.data = {} as any;
        return Promise.resolve();
    }

    /* Read operations */

    index(trx: AnyTrxNode, serialize?: boolean): Promise<Obj[]> {
        const objs = Object.values(this.data).map(obj =>
            this.model.copy(obj as any, 'load', () => !!serialize)
        )
        return Promise.resolve(objs);
    }

    get(trx: AnyTrxNode, id: Obj['id'], serialize?: boolean): Promise<Obj | undefined> {
        if (!(id in this.data)) return Promise.resolve(undefined);
        const output = this.model.copy(this.data[id], 'load', () => !!serialize) as any;
        return Promise.resolve(output);
    }

    /* Write Operations */

    async create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const input = this.model.copy(obj, 'save');

        if (!input.id) {
            const lastId = Object.values(this.data)
                .map((_obj: any) => parseInt(_obj.id))
                .sort((a,b) => b-a)[0] || 0;
            input.id = lastId+1 as any;
        }
        (this.data as any)[input.id] = input as Obj;
        
        const output = this.model.copy(input, 'load') as any;
        return Promise.resolve(output);
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
        if (!obj.id || !this.data[obj.id]) {
            throw new Error(`Object with id ${obj.id} not found for replace`)
        }
        const input = this.model.copy(obj, 'save');
        (this.data as any)[input.id as Obj['id']] = input as Obj;

        const output = this.model.copy(input, 'load') as any;
        return Promise.resolve(output);
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
        if (!obj.id || !this.data[obj.id]) {
            throw new Error(`Object with id ${obj.id} not found for patch`)
        }
        const data = this.data[obj.id] as unknown as Record<string, never>;
        const keys = Object.entries(obj).filter(([_, val]) => val !== undefined).map(([key]) => key);
        const input = this.model.copy(obj, 'save', undefined, keys) as Record<string, never>;
        for (const key in input) {
            if (input[key] === null) {
                delete data[key];
            }
            else if (input[key] !== undefined) {
                data[key] = input[key];
            }
        }
        const output = this.model.copy(data, 'load') as never;
        return Promise.resolve(output);
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
        const input = this.model.copy(obj, 'save');
        if (!input.id) {
            const lastId = Object.values(this.data)
                .map((_obj: any) => parseInt(_obj.id))
                .sort((a,b) => b-a)[0] || 0;
            input.id = lastId+1 as any;
        }
        (this.data as any)[input.id as Obj['id']] = input as Obj;

        const output = this.model.copy(input, 'load') as never;
        return Promise.resolve(output);
    }

    async putMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const lastId = Object.values(this.data)
            .map((obj: any) => parseInt(obj.id))
            .sort((a,b) => b-a)[0] || 0;
        let id = lastId+1;
        const out: any[] = [];
        for (const obj of objs) {
            const input = this.model.copy(obj, 'save');
            if (!input.id) {
                input.id = id as any;
            }
            (this.data as any)[input.id as Obj['id']] = input as Obj;
            
            const output = this.model.copy(input, 'load');
            out.push(output);
            id++;
        }
        return Promise.resolve(out);
    }

    delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<void> {
        delete this.data[id];
        return Promise.resolve();
    }

    deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<void> {
        for (const id of ids) {
            delete this.data[id];
        }
        return Promise.resolve();
    }

    /* Cache Operations */

    async syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>> {
        // 1. Check if object was deleted
        const obj = await this.get(trx, id);
        if (!obj) {
            return 'deleted' as const;
        }

        // 2. Check if object was updated
        const updateEpoch = this.getUpdateEpoch(obj);

        const hasObjUpdated = updateEpoch > lastObjUpdateEpoch;
        if (!hasObjUpdated) {
            return null;
        }

        // 3. Return updated object and epoch
        return {
            obj,
            updateEpoch
        };
    }

    async syncOneAndPast(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>[]> {
        // 1. Check if object was deleted
        const obj = await this.get(trx, id);
        if (!obj) {
            return 'deleted' as const;
        }

        // 2. Check if object was updated
        const objUpdateEpoch = this.getUpdateEpoch(obj);
        const hasObjUpdated = objUpdateEpoch > lastUpdateEpoch;       
        if (!hasObjUpdated) {
            return null;
        }

        // 3. Return all objects updated and the max epoch
        let updateEpoch = 0;
        const changed = (Object.values(this.data) as Obj[])
            .map(obj => {
                const epoch = this.getUpdateEpoch(obj);
                if (epoch > updateEpoch) {
                    updateEpoch = epoch;
                }
                return { obj, updateEpoch: epoch };
            })
            .filter(obj => obj.updateEpoch > lastUpdateEpoch);

        if (!changed.length) {
            return null;
        }

        return changed;
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
        // 1. Hash the current ids
        const idStr = Object.keys(this.data).sort().join('');
        const hash = Hash.string(idStr);

        // 2. If hash changed, return a reset sync with all objects
        if (hash !== lastHash) {
            let updateEpoch = 0;
            const sync = (Object.values(this.data) as Obj[])
                .map(obj => {
                    const epoch = this.getUpdateEpoch(obj);
                    if (epoch > updateEpoch) {
                        updateEpoch = epoch;
                    }
                    return { obj, updateEpoch: epoch };
                });
            return {
                sync,
                hash,
                updateEpoch,
                reset: true
            };
        }

        // 3. Find the data that changed and return it
        let updateEpoch = 0;
        const sync = (Object.values(this.data) as Obj[])
            .map(obj => {
                const epoch = this.getUpdateEpoch(obj);
                if (epoch > updateEpoch) {
                    updateEpoch = epoch;
                }
                return { obj, updateEpoch: epoch };
            })
            .filter(obj => obj.updateEpoch > lastUpdateEpoch);
        
        if (!sync.length) {
            return null;
        }

        return {
            sync,
            hash,
            updateEpoch,
            reset: false
        };
    }
}

export type AnyMemoryBucketAdapter = MemoryBucketAdapter<any, any>