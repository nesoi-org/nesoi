import type { BucketAdapterConfig } from './bucket_adapter';
import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { BucketCacheSync } from '../cache/bucket_cache';

import { BucketAdapter } from './bucket_adapter';
import { MemoryNQLRunner } from './memory.nql';
import { Hash } from '~/engine/util/hash';
import { BucketModel } from '../model/bucket_model';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import { Random } from '~/engine/util/random';

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
        config?: BucketAdapterConfig,
        behavior?: BucketAdapter<any, any>['behavior']
    ) {
        const nql = new MemoryNQLRunner();
        super(schema, nql, config, {
            isolated: behavior?.isolated ?? true,
            as_json: behavior?.as_json ?? false
        });
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

    private roots_only(obj: Obj, roots: string[]) {
        const out = {
            id: obj.id
        } as any;
        let i = 0; const n = roots.length;
        while (i < n) {
            out[roots[i]] = obj[roots[i] as never];
            i++;
        }
        return out;
    }

    getOne(trx: AnyTrxNode, id: Obj['id'], options?: { roots?: string[] }): Promise<Obj|undefined> {
        const out = this.data[id];
        if (!out) return Promise.resolve(undefined);
        if (options?.roots) return Promise.resolve(this.roots_only(out, options.roots))
        return Promise.resolve(out);
    }

    getMany(trx: AnyTrxNode, ids: Obj['id'][], options?: { roots?: string[] }): Promise<Obj[]> {
        const out = [] as Obj[];
        let i = 0; const n = ids.length;
        while (i < n) {
            const obj = this.data[ids[i]];
            if (obj) {
                if (options?.roots) out.push(this.roots_only(obj, options.roots))
                else out.push(obj)
            }
            i++;
        }
        return Promise.resolve(out);
    }

    getAll(trx: AnyTrxNode, options?: { roots?: string[] }): Promise<Obj[]> {
        const out = Object.values(this.data) as Obj[];
        if (options?.roots) {
            let i = 0; const n = out.length;
            while (i < n) {
                out[i] = this.roots_only(out[i], options.roots)
                i++;
            }
        }
        return Promise.resolve(out);
    }

    /* Write Operations */

    async create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>,
        options?: { return?: boolean }
    ): Promise<Obj|undefined|false> {
        const input = this.model.cast(obj) as Obj;
        if (!input.id) {
            if (this.schema.model.fields.id.type === 'int') {
                const lastId = Object.values(this.data)
                    .map((_obj: any) => _obj.id)
                    .sort((a,b) => b-a)[0] ?? 0;
                input.id = lastId+1;
            }
            else {
                input.id = Random.uuid();
            }
        }
        else {
            if (!(input.id in this.data)) return Promise.resolve(false);
        }
        (this.data as any)[input.id] = input as Obj;
        
        if (options?.return) return Promise.resolve(undefined);
        return Promise.resolve(input);
    }

    async createMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[],
        options?: { return?: boolean }
    ): Promise<Obj[]|undefined|false> {
        let i = 0; const n = objs.length;
        
        if (options?.return) {
            const out: any[] = [];
            while (i < n) {
                const item = await this.create(trx, objs[i], options);
                if (item === false) return false;
                if (item) out.push(item)
                i++;
            }
            return out;
        }
        else {
            while (i < n) {
                const item = await this.create(trx, objs[i], options)
                if (item === false) return false;
            }
            return;
        }
    }

    async replace(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>,
        options?: { return?: boolean }
    ): Promise<Obj|undefined|false> {
        if (!obj.id || !this.data[obj.id]) return false;

        const input = this.model.cast(obj) as Obj;

        (this.data as any)[input.id as Obj['id']] = input as Obj;

        if (options?.return) return Promise.resolve(undefined);
        return Promise.resolve(input);
    }

    async replaceMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[],
        options?: { return?: boolean }
    ): Promise<Obj[]|undefined|false> {
        let i = 0; const n = objs.length;
        
        if (options?.return) {
            const out: any[] = [];
            while (i < n) {
                const item = await this.replace(trx, objs[i], options);
                if (item === false) return false;
                if (item) out.push(item)
                i++;
            }
            return out;
        }
        else {
            while (i < n) {
                const item = await this.replace(trx, objs[i], options)
                if (item === false) return false;
            }
            return;
        }
    }
    
    async patch(
        trx: AnyTrxNode,
        obj: Obj,
        options?: { return?: boolean }
    ): Promise<Obj|undefined|false> {
        const data = this.data[obj.id as never] as Record<string, any>;
        if (!data) return false;

        const out = { ...data };
        const input = this.model.cast(obj) as Obj;
        for (const key in input) {
            if (input[key] === null) {
                delete out[key];
            }
            else if (input[key] !== undefined) {
                out[key] = input[key];
            }
        }
        if (options?.return) return Promise.resolve(undefined);
        return Promise.resolve(input);
    }

    async patchMany(
        trx: AnyTrxNode,
        objs: Obj[],
        options?: { return?: boolean }
    ): Promise<Obj[]|undefined|false> {
        let i = 0; const n = objs.length;
        
        if (options?.return) {
            const out: any[] = [];
            while (i < n) {
                const item = await this.patch(trx, objs[i], options);
                if (item === false) return false;
                if (item) out.push(item)
                i++;
            }
            return out;
        }
        else {
            while (i < n) {
                const item = await this.patch(trx, objs[i], options)
                if (item === false) return false;
            }
            return;
        }
    }

    async put(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const input = this.model.cast(obj);
        if (!input.id) {
            const lastId = Object.values(this.data)
                .map((_obj: any) => parseInt(_obj.id))
                .sort((a,b) => b-a)[0] || 0;
            input.id = lastId+1 as any;
        }
        (this.data as any)[input.id as Obj['id']] = input as Obj;

        const output = this.model.clone(input) as Obj;
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
            const input = this.model.cast(obj);
            if (!input.id) {
                input.id = id as any;
            }
            (this.data as any)[input.id as Obj['id']] = input as Obj;
            
            const output = this.model.clone(input);
            out.push(output);
            id++;
        }
        return Promise.resolve(out);
    }

    delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<boolean> {
        if (!(id in this.data)) return Promise.resolve(false);
        delete this.data[id];
        return Promise.resolve(true);
    }

    deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<boolean> {
        for (const id of ids) {
            if (!(id in this.data)) return Promise.resolve(false);
            delete this.data[id];
        }
        return Promise.resolve(true);
    }

    /* Cache Operations */

    async syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>> {
        // 1. Check if object was deleted
        const obj = await this.getOne(trx, id);
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
        const obj = await this.getOne(trx, id);
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