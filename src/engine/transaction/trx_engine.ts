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
    end: AnyTrx['end'],
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
                end: new $BucketModelField('end', 'end', 'datetime', 'Start', false),
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
        if (!id) {
            trx = new Trx(this, this.module, _origin, idempotent);
            Log.info('module', this.module.name, `Begin ${scopeTag('trx', trx.id)}${idempotent ? '*' : ''} @ ${anyScopeTag(_origin)}`);
            for (const wrap of this.config?.wrap || []) {
                await wrap.begin(trx, this.services);
            }
            if (!idempotent) {
                await this.adapter.create(this.innerTrx.root, {
                    id: trx.id,
                    origin: (trx as any).origin as AnyTrx['origin'],
                    start: trx.start,
                    end: trx.end,
                    module: this.module.name
                });
            }
            return trx;
        }
        else {
            if (idempotent) {
                Log.debug('module', this.module.name, `Continue Idempotent ${scopeTag('trx', id)}* @ ${anyScopeTag(_origin)}`);
                const trx = new Trx(this, this.module, _origin, idempotent, undefined, id);
                for (const wrap of this.config?.wrap || []) {
                    await wrap.continue(trx, this.services);
                }
                return trx;
            }
            const trxData = await this.adapter.get(this.innerTrx.root, id);
            if (trxData) {
                Log.debug('module', this.module.name, `Continue ${scopeTag('trx', trxData.id)} @ ${anyScopeTag(_origin)}`);
                // Objects read from adapters are not the proper JS class, so they don't
                // carry methods. This must be used to recover the methods.
                trx = Object.assign(new Trx(this, this.module, _origin, idempotent), {
                    id: trxData.id,
                    origin: trxData.origin,
                    start: trxData.start,
                    end: trxData.end
                });
                for (const wrap of this.config?.wrap || []) {
                    await wrap.continue(trx, this.services);
                }
            }
            else {
                Log.info('module', this.module.name, `Chain ${scopeTag('trx', id)} @ ${anyScopeTag(_origin)}`);
                trx = new Trx(this, this.module, _origin, idempotent, undefined, id);
                for (const wrap of this.config?.wrap || []) {
                    await wrap.begin(trx, this.services);
                }
                await this.adapter.create(this.innerTrx.root, {
                    id: trx.id,
                    origin: _origin,
                    start: trx.start,
                    end: trx.end,
                    module: this.module.name
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
            
            await this.commit(trx, output);
        }
        catch (e) {
            await this.rollback(trx, e);
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
            await this.hold(trx, output);
        }
        catch (e) {
            await this.rollback(trx, e);
        }
        return {
            id: trx.id,
            status: trx.status(),
            commit: () => this.commit(trx, output),
            rollback: (error: any) => this.rollback(trx, error)
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
        const _tokens = {} as AuthRequest<any>;
        for (const providerName in this.authnProviders) {
            if (providerName in _users) continue;
            
            const provider = this.authnProviders[providerName];
            if (!provider) {
                throw NesoiError.Auth.NoProviderRegisteredForModule(this.module.name, providerName);
            }
            const token = tokens[providerName] as string | undefined;
            if (token) {
                _tokens[providerName] = token;
                if (provider.eager || force) {
                    const { user } = await provider.authenticate({ trx: node, token });
                    _users[providerName] = user;
                }
            }
        }
        TrxNode.addAuthn(node, _tokens, _users);
    }

    //

    private async hold(trx: Trx<S, M, any>, output: any) {
        Log.debug('module', this.module.name, `Hold ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
        TrxNode.hold(trx.root, output);
        if (trx.idempotent) return trx;
        await this.adapter.put(this.innerTrx.root, {
            id: trx.id,
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name
        });
        return trx;
    }

    private async commit(trx: Trx<S, M, any>, output: any) {
        TrxNode.ok(trx.root, output);
        trx.end = NesoiDatetime.now();
        if (trx.idempotent) return trx;
        Log.info('module', this.module.name, `Commit ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
        await this.adapter.put(this.innerTrx.root, {
            id: trx.id,
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name
        });
        await Trx.onCommit(trx);
        for (const wrap of this.config?.wrap || []) {
            await wrap.commit(trx, this.services);
        }
        return trx;
    }

    private async rollback(trx: Trx<S, M, any>, error: any) {
        Log.error('module', this.module.name, `[${error.status}] ${error.toString()}`, error.stack);
        TrxNode.error(trx.root, error);
        trx.end = NesoiDatetime.now();
        if (trx.idempotent) return trx;        
        Log.warn('module', this.module.name, `Rollback ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
        await this.adapter.put(this.innerTrx.root, {
            id: trx.id,
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name
        });
        await Trx.onRollback(trx);
        for (const wrap of this.config?.wrap || []) {
            await wrap.rollback(trx, this.services);
        }
        return trx;
    }
}

export type AnyTrxEngine = TrxEngine<any, any, any>