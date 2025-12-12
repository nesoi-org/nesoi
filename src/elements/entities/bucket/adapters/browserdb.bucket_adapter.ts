import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { BucketCacheSync } from '../cache/bucket_cache';
import type { BrowserDBTrxData, BrowserDBService } from './browserdb.service';
import type { Module } from '~/engine/module';

import { TrxNode } from '~/engine/transaction/trx_node';
import { MemoryBucketAdapter } from './memory.bucket_adapter';
import { Trx } from '~/engine/transaction/trx';

/**
 * @category Adapters
 * @subcategory Entity
 * */
export class BrowserDBBucketAdapter<
    B extends $Bucket,
    Obj extends B['#data']
> extends MemoryBucketAdapter<B, Obj> {

    private refName: string;
    
    constructor(
        public schema: B,
        public service: BrowserDBService
    ) {
        super(schema, undefined, service.config);
        this.refName = `${schema.module}::${schema.name}`;
    }

    getQueryMeta() {
        return {
            scope: `browserdb.${this.schema.name}`,
            avgTime: 100
        };
    }

    /* */
    
    private trxData(trx: AnyTrxNode) {
        return Trx.get<BrowserDBTrxData>(trx, this.service.name+'.trxData');
    }
    
    private async stage(trx: AnyTrxNode, objs: Obj[]) {
        const trxData = Trx.get<BrowserDBTrxData>(trx, this.service.name+'.trxData');
        if (trxData) {
            for (const obj of objs) {
                trxData[this.refName] ??= {};
                trxData[this.refName][obj.id] = obj;
            }
        }
        else {
            const module = TrxNode.getModule(trx) as Module<any, $Module>;
            const db = await this.service.getDB(module);
            const dbTrx = db.transaction(this.refName, 'readwrite');
            const store = dbTrx.objectStore(this.refName);
            for (const obj in objs) {
                store.put(obj)
            }
            dbTrx.commit();
        }
    }
    private async flagDelete(trx: AnyTrxNode, ids: Obj['id'][]) {
        const trxData = Trx.get<BrowserDBTrxData>(trx, this.service.name+'.trxData');
        if (trxData) {
            for (const id of ids) {
                trxData[this.refName] ??= {};
                trxData[this.refName][id] = { __delete: true };
            }
        }
        else {
            const module = TrxNode.getModule(trx) as Module<any, $Module>;
            const db = await this.service.getDB(module);
            const dbTrx = db.transaction(this.refName, 'readwrite');
            const store = dbTrx.objectStore(this.refName);
            for (const id in ids) {
                store.delete(id)
            }
            dbTrx.commit();
        }
    }

    private async getStore(trx: AnyTrxNode, mode: 'readonly'|'readwrite') {
        const module = TrxNode.getModule(trx);
        const db = await this.service.getDB(module);
        const dbTrx = db.transaction(this.refName, mode);
        return dbTrx.objectStore(this.refName);
    }

    /* Read operations */

    async index(trx: AnyTrxNode): Promise<Obj[]> {
        const store = await this.getStore(trx, 'readonly');
        const objs = await new Promise<Obj[]>((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e: any) => reject(e);
        })
       
        this.data = {} as any;
        for (const obj of objs) {
            this.data[obj.id as Obj['id']] = obj as any;
        }
        Object.assign(this.data, this.trxData(trx));

        return objs;
    }

    async get(trx: AnyTrxNode, id: Obj['id']): Promise<Obj | undefined> {
        const trxData = this.trxData(trx)[this.refName];
        if (id in trxData) {
            return trxData[id] as Obj;
        }

        const store = await this.getStore(trx, 'readonly');

        const obj = await new Promise<Obj>((resolve, reject) => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e: any) => reject(e);
        })
        
        this.data[obj.id as Obj['id']] = obj as any;
        return obj;
    }

    /* Write Operations */

    async create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const _obj = await super.create(trx, obj);
        await this.stage(trx, [_obj]);
        return _obj;
    }

    async createMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const _objs = await super.createMany(trx, objs);
        await this.stage(trx, _objs);
        return _objs;
    }

    async replace(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const _obj = await super.replace(trx, obj);
        await this.stage(trx, [_obj]);
        return _obj;
    }

    async replaceMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const _objs = await super.replaceMany(trx, objs);
        await this.stage(trx, _objs);
        return _objs;
    }
    
    async patch(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const _obj = await super.patch(trx, obj);
        await this.stage(trx, [_obj]);
        return _obj;
    }

    async patchMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const _objs = await super.patchMany(trx, objs);
        await this.stage(trx, _objs);
        return _objs;
    }

    async put(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const _obj = await super.put(trx, obj);
        await this.stage(trx, [_obj]);
        return _obj;
    }

    async putMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const _objs = await super.putMany(trx, objs);
        await this.stage(trx, _objs);
        return _objs;
    }

    async delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<void> {
        await super.delete(trx, id);
        await this.flagDelete(trx, [id]);
    }

    async deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<void> {
        await super.deleteMany(trx, ids);
        await this.flagDelete(trx, ids);
    }

    /* Cache Operations */

    async syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>> {
        return super.syncOne(trx, id, lastObjUpdateEpoch);
    }

    async syncOneAndPast(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>[]> {
        return super.syncOneAndPast(trx, id, lastUpdateEpoch);
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
        return super.syncAll(trx, lastHash, lastUpdateEpoch);
    }
}

export type AnyBrowserDBBucketAdapter = BrowserDBBucketAdapter<any, any>