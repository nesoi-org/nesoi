/* @nesoi:browser ignore-file */

import type { BucketAdapterConfig } from './bucket_adapter';
import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { BucketCacheSync } from '../cache/bucket_cache';

import * as fs from 'fs';
import { MemoryBucketAdapter } from './memory.bucket_adapter';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

/**
 * @category Adapters
 * @subcategory Entity
 * */
export class JSONBucketAdapter<
    B extends $Bucket,
    Obj extends B['#data']
> extends MemoryBucketAdapter<B, Obj> {

    private refName: string;

    constructor(
        public schema: B,
        public file: string,
        config?: BucketAdapterConfig
    ) {
        super(schema, undefined, config);
        this.refName = `${schema.module}::${schema.name}`;
        this.parse();
    }

    getQueryMeta() {
        return {
            scope: `json.${this.schema.name}`,
            avgTime: 100
        };
    }

    /* */

    private parse() {
        this.data = {} as any;
        if (!fs.existsSync(this.file)) return;
        const file = fs.readFileSync(this.file);
        const fileData = JSON.parse(file.toString());

        for (const id in fileData[this.refName]) {
            this.data[id as Obj['id']] = this.model.copy2(fileData[this.refName][id], 'nesoi') as Obj;
        }
    }

    private dump() {
        let data: Record<string, any> = {
            [this.refName]: {}
        };
        if (fs.existsSync(this.file)) {
            const file = fs.readFileSync(this.file);
            data = JSON.parse(file.toString());
        }

        data[this.refName] ??= {};
        for (const id in this.data) {
            data[this.refName][id] = this.model.copy2(this.data[id as Obj['id']], 'json');
        }

        fs.writeFileSync(this.file, JSON.stringify(data));
    }

    /* Dangerous, used on cache only */

    protected deleteEverything(trx: AnyTrxNode) {
        this.data = {} as any;
        return Promise.resolve();
    }

    /* Read operations */

    get_all(trx: AnyTrxNode): Promise<Obj[]> {
        return super.get_all(trx);
    }

    get_one(trx: AnyTrxNode, id: Obj['id']): Promise<Obj | undefined> {
        return super.get_one(trx, id);
    }

    /* Write Operations */

    async create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await super.create(trx, obj);
        this.dump();
        return res;
    }

    async create_many(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.create_many(trx, objs);
        this.dump();
        return res;
    }

    async replace(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await super.replace(trx, obj);
        this.dump();
        return res;
    }

    async replace_many(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.replace_many(trx, objs);
        this.dump();
        return res;
    }
    
    async patch(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await super.patch(trx, obj);
        this.dump();
        return res;
    }

    async patch_many(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.patch_many(trx, objs);
        this.dump();
        return res;
    }

    async put(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj> {
        const res = await super.put(trx, obj);
        this.dump();
        return res;
    }

    async put_many(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.put_many(trx, objs);
        this.dump();
        return res;
    }

    async delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<void> {
        await super.delete(trx, id);
        this.dump();
    }

    async delete_many(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<void> {
        await super.delete_many(trx, ids);
        this.dump();
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

export type AnyJSONBucketAdapter = JSONBucketAdapter<any, any>