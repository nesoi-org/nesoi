import type { $Module, $Space } from '~/schema';
import type { Module } from '../module';
import type { AnyTrx, TrxStatus } from './trx';
import type { TrxNodeState, TrxNodeStatus } from './trx_node';
import type { AnyAuthnProviders, AnyUsers, AuthRequest } from '../auth/authn';
import type { BucketAdapter, BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import type { TrxEngineConfig } from './trx_engine.config';
import type { IService } from '../app/service';
import type { Tag } from '../dependency';
import type { AnyBucket } from '~/elements/entities/bucket/bucket';
import type { DriveAdapter } from '~/elements/entities/drive/drive_adapter';

import { Log, anyScopeTag, scopeTag } from '../util/log';
import { Trx } from './trx';
import { TrxNode } from './trx_node';
import { NesoiError } from '../data/error';
import { $Bucket } from '~/elements';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { $BucketGraph } from '~/elements/entities/bucket/graph/bucket_graph.schema';
import { NesoiDatetime } from '../data/datetime';

/*
    Types
*/

export type TrxEngineOrigin = `app:${string}` | `plugin:${string}`;

export type TrxData = {
    id: AnyTrx['id'],
    state: TrxNodeState,
    origin: AnyTrx['origin'],
    module: string,
    start: AnyTrx['start'],
    end: AnyTrx['end']
}


export type HeldTrxNode<Output> = {
    id: string,
    status: TrxStatus<Output>,
    commit: () => Promise<any>,
    rollback: (error: string) => Promise<any>
}

export type BucketMetadata = ReturnType<AnyBucket['getQueryMeta']> & {
    tag: Tag
    meta: BucketAdapterConfig['meta']
}

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TrxEngine<
    S extends $Space,
    M extends $Module,
    AuthUsers extends AnyAuthnProviders
> {

    private $TrxBucket;

    /**
     * Transaction used to read/write transactions on the log adapter
     */
    private innerTrx;
    private log_adapter?: BucketAdapter<TrxData>;
    
    /*
     * Ongoing Transactions
     */
    private ongoing: Record<string, TrxData> = {};

    constructor(
        private origin: TrxEngineOrigin,
        private module: Module<S, M>,
        private authnProviders?: AuthUsers,
        private config?: TrxEngineConfig<S, M, any, any>,
        private services: Record<string, IService> = {}
    ) {
        this.innerTrx = new Trx<S, M, any>(this, this.module, `trx:${origin}`, true);
        
        this.$TrxBucket = new $Bucket(
            this.module.name,
            '__trx__',
            `Transaction of Module '${this.module.name}'`,
            new $BucketModel({
                id: new $BucketModelField('id', 'id', 'string', 'ID', true),
                state: new $BucketModelField('state', 'state', 'string', 'State', true), // TrxNodeState
                origin: new $BucketModelField('origin', 'origin', 'string', 'Origin', true),
                module: new $BucketModelField('module', 'module', 'string', 'Module', true),
                start: new $BucketModelField('start', 'start', 'datetime', 'Start', true),
                end: new $BucketModelField('end', 'end', 'datetime', 'End', false)
            }),
            new $BucketGraph(),
            {}
        )

        if (config?.log_adapter) {
            this.log_adapter = config?.log_adapter?.(this.$TrxBucket);
        }
    }

    public getModule() {
        return this.module;
    }

    async get(id?: string, origin?: string, req_idempotent = false) {
        const _origin = (origin as TrxEngineOrigin) ?? this.origin;
        let trx: Trx<S, M, any>;

        // New transaction
        if (!id) {
            trx = new Trx(this, this.module, _origin, req_idempotent);
            Log.debug('module', this.module.name, `Begin${req_idempotent ? '*' : ''} ${scopeTag('trx', trx.root.globalId)} @ ${anyScopeTag(_origin)}`);
            for (const wrap of this.config?.wrap || []) {
                // The wrappers decide how to begin a db transaction, based on the trx idempotent flag.
                await wrap.begin(trx, this.services);
            }
            if (!req_idempotent) {
                this.ongoing[trx.id] = {
                    id: trx.id,
                    state: 'open',
                    origin: (trx as any).origin as AnyTrx['origin'],
                    start: trx.start,
                    end: trx.end,
                    module: this.module.name,
                };
            }
            return trx;
        }

        // Chain/Continue transaction
        else {
            const trxData = await this.ongoing[id];
            
            // If trxData exists, the transaction to which it refers is non-idempotent,
            // since idempotent transactions are not stored.
            //
            // If a transaction is being continued it cannot become idempotent,
            // since the data it needs is inside the transaction.
            //
            // If the transaction started as non-idempotent and is continued as idempotent,
            // the code below will transform it into non-idempotent, however
            // the engine.ok and engine.error still treat it as idempotent, to avoid commit/rollback
            // of the original transaction.
            //
            // Differently, a transaction with specific id which doesn't exist can
            // be either an ongoing idempotent transaction from this module or an
            // external transaction starting at a different module.
            // On either case, it's allowed to be idempotent or not.
            const idempotent = trxData ? false : req_idempotent;

            trx = new Trx(this, this.module, _origin, idempotent, undefined, id);

            // (Begin/Continue*)
            // The request is for an idempotent transaction.
            if (req_idempotent) {
                // A non-idempotent transaction with the same id exists on this module.
                // so it's being continued as an idempotent transaction.
                if (trxData) {
                    Log.debug('module', this.module.name, `Continue* ${scopeTag('trx', trx.root.globalId)} @ ${anyScopeTag(_origin)}`);
                    if (trxData.state !== 'hold') {
                        throw new Error(`Attempt to continue transaction ${trxData.id}, currently at '${trxData.state}', failed. Should be at 'hold'. This might mean there are parallel attempts to continue a transaction, which must be handled with a queue.`)
                    }
                    for (const wrap of this.config?.wrap || []) {
                        // The wrappers decide how to continue a db transaction, based on the trx idempotent flag.
                        await wrap.continue(trx, this.services);
                    }
                }
                // No transaction with the same id exists on this module.
                // so it's starting as an idempotent transaction.
                else {
                    Log.debug('module', this.module.name, `Begin* ${scopeTag('trx', trx.root.globalId)} @ ${anyScopeTag(_origin)}`);

                    for (const wrap of this.config?.wrap || []) {
                        // The wrappers decide how to begin a db transaction, based on the trx idempotent flag.
                        await wrap.begin(trx, this.services);
                    }
                }
                
                return trx;
            }

            // (Continue)
            // A non-idempotent transaction with the same id exists on this module,
            // so it's being continued.
            if (trxData) {
                Log.debug('module', this.module.name, `Continue ${scopeTag('trx', trx.root.globalId)} @ ${anyScopeTag(_origin)}`);
                if (trxData.state !== 'hold') {
                    throw new Error(`Attempt to continue transaction ${trxData.id}, currently at '${trxData.state}', failed. Should be at 'hold'. This might mean there are parallel attempts to continue a transaction, which must be handled with a queue.`)
                }

                // Update transaction with data read from adapter
                trx.start = trxData.start;
                trx.end = trxData.end;
                
                for (const wrap of this.config?.wrap || []) {
                    // The wrappers decide how to continue a db transaction, based on the trx idempotent flag.
                    await wrap.continue(trx, this.services);
                }
            }
            // (Chain)
            // No transaction with the same id exists on this module,
            // so it's starting as a "chained" transaction - a new one with
            // the same ID as the one from some module.
            else {
                Log.debug('module', this.module.name, `Chain${trx.idempotent ? '*' : ''} ${scopeTag('trx', trx.root.globalId)} @ ${anyScopeTag(_origin)}`);
                for (const wrap of this.config?.wrap || []) {
                    // The wrappers decide how to begin a db transaction, based on the trx idempotent flag.
                    await wrap.begin(trx, this.services);
                }
                this.ongoing[trx.id] = {
                    id: trx.id,
                    state: 'open',
                    origin: _origin,
                    start: trx.start,
                    end: trx.end,
                    module: this.module.name,
                };
            }
        }
        return trx;
    }

    async trx(
        fn: (trx: TrxNode<S, M, any>) => Promise<TrxNodeStatus>,
        id?: string,
        tokens?: AuthRequest<keyof AuthUsers>,
        users?: Partial<AuthUsers>,
        origin?: string,
        idempotent = false
    ) {
        const trx = await this.get(id, origin, idempotent);
        try {
            await this.authenticate(trx.root, tokens, users as any)
            const output = await fn(trx.root);
            
            await this.ok(trx, output, idempotent);
        }
        catch (e) {
            await this.error(trx, e, idempotent);
        }
        return trx.status();
    }

    async trx_hold(
        fn: (trx: TrxNode<S, M, any>) => Promise<any>,
        id?: string,
        authn?: AuthRequest<keyof AuthUsers>,
        users?: Partial<AuthUsers>,
        origin?: string
    ): Promise<HeldTrxNode<any>> {
        const trx = await this.get(id, origin, false);
        let output: Record<string, any> = {};
        try {
            await this.authenticate(trx.root, authn, users as any)

            output = await fn(trx.root);
            await this.hold(trx, output);
        }
        catch (e) {
            await this.error(trx, e, false);
        }
        return {
            id: trx.id,
            status: trx.status(),
            commit: () => this.ok(trx, output, false),
            rollback: (error: any) => this.error(trx, error, false)
        }
    }

    /* Metadata sharing between modules */

    public getBucketMetadata(tag: Tag): BucketMetadata {
        return {
            ...this.module.buckets[tag.name].getQueryMeta(),
            tag,
            meta: this.module.buckets[tag.name].adapter.config.meta,
        }
    }

    public getBucketDrive(tag: Tag): DriveAdapter | undefined {
        return this.module.buckets[tag.name].drive
    }

    // authentication

    public async authenticate(node: TrxNode<S, M, any>, tokens: AuthRequest<keyof AuthUsers> = {}, users: AnyUsers = {}, force = false) {
        if (!this.authnProviders) {
            throw NesoiError.Auth.NoProvidersRegisteredForModule(this.module.name);
        }
        const _users = {...users} as AnyUsers;
        const _tokens = {...tokens} as AuthRequest<any>;
        for (const providerName in this.authnProviders) {
            if (providerName in _users) continue;
            
            const provider = this.authnProviders[providerName];
            if (!provider) {
                throw NesoiError.Auth.NoProviderRegisteredForModule(this.module.name, providerName);
            }
            const token = tokens[providerName] as string | undefined;
            if (token) {
                if (provider.eager || force) {
                    const out = await provider.authenticate({ trx: node, token });
                    _tokens[providerName] = out.token ?? token;
                    _users[providerName] = out.user;
                }
            }
        }
        TrxNode.addAuthn(node, _tokens, _users);
    }

    //

    private async hold(trx: Trx<S, M, any>, output: any) {
        Log.debug('module', this.module.name, `Hold ${scopeTag('trx', trx.root.globalId)}`);
        TrxNode.hold(trx.root, output);
        this.ongoing[trx.id] = {
            id: trx.id,
            state: 'hold',
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
        };
        return trx;
    }

    private async ok(trx: Trx<S, M, any>, output: any, idempotent: boolean) {
        Log.debug('module', this.module.name, `Ok${idempotent?'*':''} ${scopeTag('trx', trx.root.globalId)}`);
        TrxNode.ok(trx.root, output);
        trx.end = NesoiDatetime.now();

        const held_children = Object.keys(trx.holds).length;
        if (held_children) {
            Log.debug('module', this.module.name, `Commit Holds ${scopeTag('trx', trx.root.globalId)} (${held_children})`);
            await Trx.commitHolds(trx);
        }
        if (idempotent) return trx;
        return this.commit(trx);
    }

    private async commit(trx: Trx<S, M, any>) {
        Log.debug('module', this.module.name, `Commit ${scopeTag('trx', trx.root.globalId)}`);
        await this.log_adapter?.put(this.innerTrx.root, {
            id: trx.id,
            state: 'ok',
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
        });
        delete this.ongoing[trx.id];

        for (const wrap of this.config?.wrap || []) {
            await wrap.commit(trx, this.services);
        }
        return trx;
    }

    private async error(trx: Trx<S, M, any>, error: any, idempotent: boolean) {
        Log.error('module', this.module.name, `[${error.status}]${idempotent?'*':''} ${error.toString()}`, error.stack);
        TrxNode.error(trx.root, error);
        trx.end = NesoiDatetime.now();

        const held_children = Object.keys(trx.holds).length;
        if (held_children) {
            Log.debug('module', this.module.name, `Rollback Holds ${scopeTag('trx', trx.root.globalId)} (${held_children})`);
            await Trx.rollbackHolds(trx);
        }

        if (idempotent) return trx;        
        return this.rollback(trx);
    }

    private async rollback(trx: Trx<S, M, any>) {
        Log.warn('module', this.module.name, `Rollback ${scopeTag('trx', trx.root.globalId)} (held: ${Object.keys(trx.holds).length})`);
        await this.log_adapter?.put(this.innerTrx.root, {
            id: trx.id,
            state: 'error',
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
        });
        delete this.ongoing[trx.id];

        for (const wrap of this.config?.wrap || []) {
            await wrap.rollback(trx, this.services);
        }
        return trx;
    }
}

export type AnyTrxEngine = TrxEngine<any, any, any>