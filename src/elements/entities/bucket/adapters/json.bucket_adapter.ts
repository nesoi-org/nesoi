/* @nesoi:browser ignore-file */

import type { BucketAdapterConfig } from './bucket_adapter';
import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { BucketCacheSync } from '../cache/bucket_cache';

import * as fs from 'fs';
import { MemoryBucketAdapter } from './memory.bucket_adapter';

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
            this.data[id as Obj['id']] = this.model.copy(fileData[this.refName][id], 'load', true);
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
            data[this.refName][id] = this.model.copy(this.data[id as Obj['id']], 'save', true);
        }

        fs.writeFileSync(this.file, JSON.stringify(data));
    }

    /* Dangerous, used on cache only */

    protected deleteEverything(trx: AnyTrxNode) {
        this.data = {} as any;
        return Promise.resolve();
    }

    /* Read operations */

    index(trx: AnyTrxNode): Promise<Obj[]> {
        return super.index(trx);
    }

    get(trx: AnyTrxNode, id: Obj['id']): Promise<Obj | undefined> {
        return super.get(trx, id);
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

    async createMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.createMany(trx, objs);
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

    async replaceMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.replaceMany(trx, objs);
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

    async patchMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.patchMany(trx, objs);
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

    async putMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]> {
        const res = await super.putMany(trx, objs);
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

    async deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<void> {
        await super.deleteMany(trx, ids);
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