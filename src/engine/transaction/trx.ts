import type { Module } from '../module';
import type { AnyTrxNode, TrxNodeState, TrxNodeStatus } from './trx_node';
import type { AnyTrxEngine, TrxEngineOrigin } from './trx_engine';
import type { NesoiError } from '../data/error';
import type { AnyBucket } from '~/elements/entities/bucket/bucket';

import { TrxNode } from './trx_node';
import { colored } from '../util/string';
import { anyScopeTag } from '../util/log';
import { BucketCache } from '~/elements/entities/bucket/cache/bucket_cache';
import { Tag } from '../dependency';
import type { AnyUsers, AuthRequest } from '../auth/authn';
import { Random } from '../util/random';

/*
    Types
*/

export type TrxOrigin = TrxEngineOrigin | `controller:${string}` | `trx:${string}`;

/*
    Transaction Status
*/

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TrxStatus<Output> {
    constructor (
        public id: string,
        public idempotent: boolean,
        public origin: TrxOrigin,
        public start: bigint,
        public end?: bigint,
        public state?: TrxNodeState,
        public output?: Output,
        public error?: NesoiError.BaseError,
        public nodes: TrxNodeStatus[] = []
    ) {}

    summary() {
        const state = this.state ? colored(`[${this.state}]`, {
            'open': 'lightblue' as const,
            'paused': 'lightgray' as const,
            'held': 'yellow' as const,
            'ok': 'lightgreen' as const,
            'error': 'lightred' as const
        }[this.state]) : 'unknown';

        const mod = colored(this.idempotent?'r-':'rw', 'darkgray');

        let str = `${state}${mod} ${this.id} ${anyScopeTag(this.origin)} `;
        const runtime = this.end ? (Number(this.end - this.start)/1000000).toFixed(3) : -1;
        str += colored(`[${runtime}ms]\n`, 'brown')
        function print(nodes: TrxNodeStatus[], idempotent: boolean, l = 1) {
            let str = '';
            nodes.forEach(node => {
                const _idempotent = node.ext?.idempotent ?? idempotent;
                const state = node.state ? colored(`[${node.state}]`, {
                    'open': 'lightblue' as const,
                    'paused': 'lightgray' as const,
                    'held': 'yellow' as const,
                    'ok': 'lightgreen' as const,
                    'error': 'lightred' as const
                }[node.state] || 'lightred') : 'unknown';
                const mod = colored(_idempotent?'r-':'rw', 'darkgray');
                str += `${'-'.repeat(l)}${state}${mod} ${node.id} ${anyScopeTag(node.scope)} ${node.action} ${node.cached_buckets > 0 ? `[cached: ${node.cached_buckets}]` : ''}`;
                str += colored(` [${node.runtime}ms]\n`, 'brown')
                str += print(node.nodes, _idempotent, l+1);
            });
            return str;
        }
        return str + print(this.nodes, this.idempotent);
    }
}

export type TrxNodeChild<Output> = {
    id: string,
    status: TrxStatus<Output>,
    ok: () => Promise<any>,
    error: (error: NesoiError.BaseError) => Promise<any>
}

/**
 * @category Engine
 * @subcategory Transaction
 */
export class Trx<S extends $Space, M extends $Module, AuthUsers extends AnyUsers> {

    // Used externally by adapters, through Trx.get, to access
    // module metadata.
    private module: Module<S, M>;
    
    public id: string;
    
    private origin: TrxOrigin;
    public idempotent: boolean;
    
    public root: TrxNode<S, M, AuthUsers>;
    public nodes: Record<string, TrxNode<S, M, AuthUsers>>;
    
    public root_id?: string;
    public parent?: AnyTrx;
    public children: Record<string, TrxNodeChild<any>> = {};

    public start: bigint = process.hrtime.bigint();
    public end?: bigint;
    
    public ctx: Record<string, any> = {};

    constructor(
        public engine: AnyTrxEngine,
        module: Module<S, M>,
        origin: TrxOrigin,
        root_id?: string,
        parent?: AnyTrx,
        idempotent: boolean = false,
        auth?: {
            tokens: AuthRequest<any>,
            users: AuthUsers,
        },
        id?: string,
        root?: TrxNode<S, M, AuthUsers>,
        nodes?: Record<string, TrxNode<S, M, AuthUsers>>
    ) {
        this.module = module;
        
        this.id = id || Random.bytes(4).toString('hex');
        this.root_id ??= this.id;
        
        this.origin = origin;
        this.idempotent = idempotent;

        this.root = root || new TrxNode('root', this, undefined, module, auth, false);
        this.nodes = nodes || {};

        this.parent = parent;
    }

    addNode(node: TrxNode<S, M, AuthUsers>) {
        const nodeId = (node as any).id as TrxNode<S, M, AuthUsers>['id'];
        this.nodes[nodeId] = node;
    }

    status(): TrxStatus<any> {
        const state = (this.root as any).state as AnyTrxNode['state'];
        const output = (this.root as any).output as AnyTrxNode['output'];
        const error = (this.root as any).error as AnyTrxNode['error'];
        return new TrxStatus(
            this.id,
            this.idempotent,
            this.origin,
            this.start,
            this.end,
            state,
            output,
            error,
            this.root.status().nodes
        );
    }

    /**
     * Cache
     * 
     * This is used internally to initialize and access transaction-level bucket caches.
     * These are configured through the TrxNode.cache method.
     */
    public static async getCache(node: AnyTrxNode, bucket: AnyBucket) {
        const tag = new Tag(bucket.schema.module, 'bucket', bucket.schema.name);
        
        let cache = node._cache[tag.short];
        if (cache) {
            return cache;
        }

        const config = node.cache_config[tag.short];
        if (!config) return;

        let mode;
        switch (config) {
        case 'eager':
            mode = { get: 'eager' as const, index: 'eager' as const, query: 'eager' as const };
            break;
        }

        node._cache[tag.short] = new BucketCache(bucket, { mode });
        cache = node._cache[tag.short];

        if (config === 'eager') {
            await cache.sync(node);
        }

        return cache;
    }

    /**
     * Context Manipulation
     * 
     * This should only be used by custom adapters to inject/read custom things
     * to the transaction. Elements should not modify the transaction.
     */
    public static get<T>(node: AnyTrxNode, key: string): T {
        const trx = (node as any).trx as AnyTrxNode['trx'];
        return trx.ctx[key];
    }

    /**
     * Context Manipulation
     * 
     * This should only be used by custom adapters to inject/read custom things
     * to the transaction. Elements should not modify the transaction.
     */
    public static set(node: AnyTrxNode, key: string, value: any) {
        const trx = (node as any).trx as AnyTrxNode['trx'];
        trx.ctx[key] = value;
        return trx;
    }
}

export type AnyTrx = Trx<any, any, any>