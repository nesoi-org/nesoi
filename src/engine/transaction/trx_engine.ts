import { $Module, $Space } from '~/schema';
import { Module } from '../module';
import { Log, anyScopeTag, scopeTag } from '../util/log';
import { AnyTrx, Trx, TrxStatus } from './trx';
import { TrxNode, TrxNodeStatus } from './trx_node';
import { AnyAuthnProviders, AnyUsers, AuthRequest } from '../auth/authn';
import { NesoiError } from '../data/error';
import { BucketAdapter, BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { MemoryBucketAdapter } from '~/elements/entities/bucket/adapters/memory.bucket_adapter';
import { TrxEngineConfig } from './trx_engine.config';
import { IService } from '../app/service';
import { $Bucket } from '~/elements';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { $BucketGraph } from '~/elements/entities/bucket/graph/bucket_graph.schema';
import { NesoiDatetime } from '../data/datetime';
import { Tag } from '../dependency';
import { AnyBucket } from '~/elements/entities/bucket/bucket';
import { DriveAdapter } from '~/elements/entities/drive/drive_adapter';

/*
    Types
*/

export type TrxEngineOrigin = `app:${string}` | `plugin:${string}`;

export type TrxData = {
    id: AnyTrx['id'],
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
     * Transaction used to read/write transactions on the adapter
     */
    private innerTrx;
    private adapter: BucketAdapter<TrxData>;

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
                origin: new $BucketModelField('origin', 'origin', 'string', 'Origin', true),
                module: new $BucketModelField('module', 'module', 'string', 'Module', true),
                start: new $BucketModelField('start', 'start', 'datetime', 'Start', true),
                end: new $BucketModelField('end', 'end', 'datetime', 'End', false),
            }),
            new $BucketGraph(),
            {}
        )
        this.adapter = config?.adapter?.(module.schema) || new MemoryBucketAdapter<$Bucket, any>(this.$TrxBucket, {});
    }

    public getModule() {
        return this.module;
    }

    async get(id?: string, origin?: string, idempotent = false) {
        const _origin = (origin as TrxEngineOrigin) ?? this.origin;
        let trx: Trx<S, M, any>;

        // New transaction
        if (!id) {
            trx = new Trx(this, this.module, _origin, idempotent);
            Log.info('module', this.module.name, `Begin${idempotent ? '*' : ''} ${scopeTag('trx', trx.id+trx.root.id)} @ ${anyScopeTag(_origin)}`);
            for (const wrap of this.config?.wrap || []) {
                await wrap.begin(trx, this.services);
            }
            if (!idempotent) {
                await this.adapter.create(this.innerTrx.root, {
                    id: trx.id,
                    origin: (trx as any).origin as AnyTrx['origin'],
                    start: trx.start,
                    end: trx.end,
                    module: this.module.name,
                });
            }
            return trx;
        }

        // Chain/Continue transaction
        else {
            const trxData = await this.adapter.get(this.innerTrx.root, id);

            // If a transaction is being continued it cannot become idempotent,
            // since the data it needs is inside the transaction.
            // > Started as NOT idempotent on this module, is NEVER idempotent
            
            // This only affects services which need this info for deciding whether
            // to commit/rollback a transaction. The trx engine still uses the requested
            // idempotent value to decide whether to run or not a commit/rollback,
            // because otherwise it would commit/rollback partially idempotent transactions
            // before they're actually finished.
            if (trxData) idempotent = false;

            // Differently, a transaction with specific id which doesn't exist can
            // be either an ongoing idempotent transaction from this module or an
            // external transaction starting at a different module.
            // On either case, it's allowed to become idempotent.
            // > Not stored, can become idempotent.
            // if (!trxData) idempotent = idempotent;

            trx = new Trx(this, this.module, _origin, idempotent, undefined, id);

            // (Continue*)
            if (idempotent) {
                Log.info('module', this.module.name, `Continue* ${scopeTag('trx', id)} @ ${anyScopeTag(_origin)}`);
                for (const wrap of this.config?.wrap || []) {
                    await wrap.continue(trx, this.services);
                }
                return trx;
            }

            // (Continue)
            if (trxData) {
                // Update transaction with data read from adapter
                trx.start = trxData.start;
                trx.end = trxData.end;
                
                Log.info('module', this.module.name, `Continue ${scopeTag('trx', trx.id+trx.root.id)} @ ${anyScopeTag(_origin)}`);
                for (const wrap of this.config?.wrap || []) {
                    await wrap.continue(trx, this.services);
                }
            }
            // (Chain)
            else {
                Log.info('module', this.module.name, `Chain ${scopeTag('trx', id+trx.root.id)} @ ${anyScopeTag(_origin)}`);
                for (const wrap of this.config?.wrap || []) {
                    await wrap.begin(trx, this.services);
                }
                await this.adapter.create(this.innerTrx.root, {
                    id: trx.id,
                    origin: _origin,
                    start: trx.start,
                    end: trx.end,
                    module: this.module.name,
                });
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
            
            await this.commit(trx, output, idempotent);
        }
        catch (e) {
            await this.rollback(trx, e, idempotent);
        }
        return trx.status();
    }

    async trx_hold(
        fn: (trx: TrxNode<S, M, any>) => Promise<any>,
        id?: string,
        authn?: AuthRequest<keyof AuthUsers>,
        users?: Partial<AuthUsers>,
        origin?: string,
        idempotent = false
    ): Promise<HeldTrxNode<any>> {
        const trx = await this.get(id, origin, idempotent);
        let output: Record<string, any> = {};
        try {
            await this.authenticate(trx.root, authn, users as any)

            output = await fn(trx.root);
            await this.hold(trx, output, idempotent);
        }
        catch (e) {
            await this.rollback(trx, e, idempotent);
        }
        return {
            id: trx.id,
            status: trx.status(),
            commit: () => this.commit(trx, output, idempotent),
            rollback: (error: any) => this.rollback(trx, error, idempotent)
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

    private async hold(trx: Trx<S, M, any>, output: any, idempotent: boolean) {
        Log.debug('module', this.module.name, `Hold ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
        TrxNode.hold(trx.root, output);
        if (idempotent) return trx;
        await this.adapter.put(this.innerTrx.root, {
            id: trx.id,
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
        });
        return trx;
    }

    private async commit(trx: Trx<S, M, any>, output: any, idempotent: boolean) {
        TrxNode.ok(trx.root, output);
        trx.end = NesoiDatetime.now();
        if (idempotent) return trx;
        await Trx.onCommit(trx);
        Log.info('module', this.module.name, `Commit ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)} (held: ${Object.keys(trx.holds).length})`);
        await this.adapter.put(this.innerTrx.root, {
            id: trx.id,
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
        });
        for (const wrap of this.config?.wrap || []) {
            await wrap.commit(trx, this.services);
        }
        return trx;
    }

    private async rollback(trx: Trx<S, M, any>, error: any, idempotent: boolean) {
        Log.error('module', this.module.name, `[${error.status}] ${error.toString()}`, error.stack);
        TrxNode.error(trx.root, error);
        trx.end = NesoiDatetime.now();
        if (idempotent) return trx;        
        await Trx.onRollback(trx);
        Log.warn('module', this.module.name, `Rollback ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)} (held: ${Object.keys(trx.holds).length})`);
        await this.adapter.put(this.innerTrx.root, {
            id: trx.id,
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
        });
        for (const wrap of this.config?.wrap || []) {
            await wrap.rollback(trx, this.services);
        }
        return trx;
    }
}

export type AnyTrxEngine = TrxEngine<any, any, any>