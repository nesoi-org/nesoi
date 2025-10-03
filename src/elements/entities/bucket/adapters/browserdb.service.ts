import { Log } from 'nesoi/lib/engine/util/log';
import { AnyTrx, Trx } from 'nesoi/lib/engine/transaction/trx';
import { TrxEngineWrapFn } from 'nesoi/lib/engine/transaction/trx_engine.config';
import { Service } from '~/engine/app/service';
import { MemoryNQLRunner } from './memory.nql';
import { BucketAdapterConfig } from './bucket_adapter';
import { Module } from '~/engine/module';
import { $Bucket, $Module } from '~/elements';
import { BrowserDBBucketAdapter } from './browserdb.bucket_adapter';
import { Daemon } from '~/engine/daemon';

export type BrowserDBConfig = BucketAdapterConfig & {
    dbName: string
    dbVersion: number
}


export type BrowserDBTrxData = {
    [tag: string]: {
        [id: string|number]: Record<string, any> | { __delete: true }
    }
}

/* @nesoi:browser ignore-start */
const window = {} as any;
type IDBFactory = any;
type IDBDatabase = any;
/* @nesoi:browser ignore-end */


export class BrowserDBService<Name extends string = 'idb'>
    extends Service<Name, BrowserDBConfig> {

    static defaultName = 'idb';

    // This works on all devices/browsers, and uses IndexedDBShim as a final fallback 
    private indexedDB: IDBFactory = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB
    
    public connected = false;
    
    private db!: IDBDatabase;
    public nql!: MemoryNQLRunner;

    async up() {
        this.nql = new MemoryNQLRunner();
    }
    
    async down() {
        await this.db.close();
    }

    // Open (or create) the database
    private connect(buckets: $Bucket[]) {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = this.indexedDB.open(this.config.dbName, this.config.dbVersion);
            request.onupgradeneeded = (e: any) => {
                this.db = (e.currentTarget as any)?.result as IDBDatabase;
                for (const bucket of buckets) {
                    const refName = `${bucket.module}::${bucket.name}`;
                    if(!this.db.objectStoreNames.contains(refName)) {
                        const autoIncrement = bucket.model.fields.id.type === 'int';
                        this.db.createObjectStore(refName, {
                            keyPath: 'id',
                            autoIncrement
                        });
                        Log.info('bucket','BrowserDB',`Store ${refName} created on database ${this.config.dbName}@${this.config.dbVersion}`)
                    }
                }
            }
            request.onsuccess = (e: any) => {
                const db = (e.target as any)?.result as IDBDatabase;
                resolve(db)
            }
            request.onerror = (e: any) => {
                Log.error('bucket','browserDB',e.toString());
                reject(e);
            }
        });
    }

    public static async db(service: BrowserDBService, module: Module<any, $Module>) {
        if (!service.db) {
            Log.info('service' as any, 'BrowserDB', 'Connecting to BrowserDB database');

            const modules = Daemon.getModules(module.daemon!);
            const buckets = Object.values(modules)
                .map(module => Object.values(module.buckets))
                .flat(1)
                .filter(b => b.adapter instanceof BrowserDBBucketAdapter)
                .map(b => b.schema);
            
            service.db = await service.connect(buckets);
        }
        return service.db;
    }

    public static wrap(service: string) {
        return async (trx: AnyTrx, fn: TrxEngineWrapFn<any, any>, services: Record<string, any>) => {
            const module = trx.engine.getModule() as Module<any, $Module>;
            const db = await BrowserDBService.db(services[service], module);           
            
            const refNames = Object.keys(module.buckets)
                .map(key =>
                    key.includes('::')
                        ? key
                        : `${module.name}::${key}`
                )

            const trxData: BrowserDBTrxData = {}
            Trx.set(trx.root, service + '.trxData', trxData);
            
            const output = await fn(trx.root);

            const dbTrx = db.transaction(refNames, 'readwrite');
            for (const tag in trxData) {
                const store = dbTrx.objectStore(tag);
                for (const id in trxData[tag]) {
                    const obj = trxData[tag][id];
                    if ('__delete' in obj) {
                        store.delete(id);
                    }
                    else {
                        store.put(obj);
                    }
                }
            }
            dbTrx.commit();
            return output;
        };
    }

}