import { BucketAdapter, BucketAdapterConfig } from './bucket_adapter';
import { createHash } from 'crypto';
import { NesoiObj, NewOrOldObj } from '~/engine/data/obj';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { $Bucket } from '~/elements';
import { MemoryNQLRunner } from './memory.nql';

export class MemoryBucketAdapter<
    Obj extends NesoiObj
> extends BucketAdapter<Obj> {

    constructor(
        public schema: $Bucket,
        public data: Record<Obj['id'], Obj> = {} as any,
        config?: BucketAdapterConfig
    ) {
        const nql = new MemoryNQLRunner();
        super(schema, nql, config);
        nql.bind(this);
    }

    getQueryMeta() {
        return {
            scope: `memory.${this.schema.name}`,
            avgTime: 10
        };
    }

    /* Dangerous, used on cache only */

    protected deleteEverything(trx: AnyTrxNode) {
        this.data = {} as any;
        return Promise.resolve();
    }

    /* Read operations */

    index(trx: AnyTrxNode) {
        const objs = Object.values(this.data) as Obj[];
        return Promise.resolve(objs);
    }

    get(trx: AnyTrxNode, id: Obj['id']) {
        return Promise.resolve(this.data[id]);
    }

    /* Write Operations */

    async put(
        trx: AnyTrxNode,
        obj: NewOrOldObj<Obj>
    ) {
        if (!obj.id) {
            const lastId = (await this.index(trx))
                .map((obj: any) => parseInt(obj.id))
                .sort((a,b) => b-a)[0] || 0;
            obj.id = lastId+1 as any;
        }
        this.data[obj.id as Obj['id']] = obj as Obj;
        return Promise.resolve(obj as any);
    }

    putMany(
        trx: AnyTrxNode,
        objs: NewOrOldObj<Obj>[]
    ) {
        return Promise.all(objs.map(obj => this.put(trx, obj)));
    }

    delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ) {
        delete this.data[id];
        return Promise.resolve();
    }

    deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ) {
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
    ) {
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
    ) {
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
    ) {
        // 1. Hash the current ids
        const idStr = Object.keys(this.data).sort().join('');
        const hash = createHash('md5').update(idStr).digest('hex');

        // 2. If hash changed, return a reset sync with all objects
        if (hash !== lastHash) {
            let updateEpoch = 0;
            const sync = (await this.index(trx) as Obj[])
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