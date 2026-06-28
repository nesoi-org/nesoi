import type { Module } from '../module';
import type { AnyTrx, TrxOrigin, TrxStatus } from './trx';
import type { AnyTrxNode, t_TrxNode } from './trx_node';
import type { BucketAdapter, BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import type { TrxData, TrxEngineConfig } from './trx_engine.config';
import type { IService } from '../app/service';
import type { AnyBucket } from '~/elements/entities/bucket/bucket';
import type { DriveAdapter } from '~/elements/entities/drive/drive_adapter';

import { Log, anyScopeTag, scopeTag } from '../util/log';
import { Trx } from './trx';
import { TrxNode } from './trx_node';
import { NesoiError } from '../data/error';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { $BucketGraph } from '~/elements/entities/bucket/graph/bucket_graph.schema';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import type { AnyAuthnProviders, AnyUsers, AuthRequest } from '../auth/authn';

/*
    (Naming convention)
    Through the comments of this file, the following terms have been translated
    for easier read. Keep these in mind:

    idempotent -> readonly
    non-idempotent -> readwrite
*/


/*
    Types
*/

export type TrxEngineOrigin = `app:${string}` | `service:${string}`;



export type BucketReference = {
    query: ReturnType<AnyBucket['getQueryMeta']>
    schema: $Bucket
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
    private ongoing: Record<string, AnyTrx> = {};

    constructor(
        private origin: TrxEngineOrigin,
        private module: Module<S, M>,
        private authnProviders?: AuthUsers,
        private config?: TrxEngineConfig<S, M, any, any>,
        private services: Record<string, IService> = {}
    ) {
        this.innerTrx = new Trx<S, M, any>(this, this.module, `trx:${origin}`, undefined, undefined, false);
        
        this.$TrxBucket = new $Bucket(
            this.module.name,
            '__trx__',
            `Transaction of Module '${this.module.name}'`,
            new $BucketModel({
                id: new $BucketModelField('id', 'id', 'int', 'ID', true),
                trx_id: new $BucketModelField('trx_id', 'trx_id', 'string', 'Transaction ID', true),
                idempotent: new $BucketModelField('idempotent', 'idempotent', 'boolean', 'Idempotent', true), // TrxNodeState
                state: new $BucketModelField('state', 'state', 'string', 'State', true), // TrxNodeState
                origin: new $BucketModelField('origin', 'origin', 'string', 'Origin', true),
                module: new $BucketModelField('module', 'module', 'string', 'Module', true),
                start: new $BucketModelField('start', 'start', 'datetime', 'Start', true),
                end: new $BucketModelField('end', 'end', 'datetime', 'End', true),
                data: new $BucketModelField('data', 'data', 'dict', 'Data', false, undefined, undefined, {
                    '#': new $BucketModelField('#', 'data.#', 'unknown', 'Data#', false)
                }),
                error: new $BucketModelField('error', 'error', 'dict', 'Error', false, undefined, undefined, {
                    '#': new $BucketModelField('#', 'error.#', 'unknown', 'Error#', false)
                }),
            }),
            new $BucketGraph(),
            {}
        )

        if (config?.log?.adapter) {
            this.log_adapter = config?.log?.adapter(this.$TrxBucket);
        }
    }

    public getModule() {
        return this.module;
    }

    public async trx(
        fn: (trx: TrxNode<S, M, any>) => Promise<any>,
        options?: {
            tokens?: AuthRequest<keyof AuthUsers>,
            users?: Partial<AuthUsers>,
            origin?: TrxOrigin,
            idempotent?: boolean
        }
    ): Promise<TrxStatus<any>> {
        // Start transaction
        const trx = await this.begin(options?.origin ?? this.origin, undefined, options?.idempotent);

        try {
            // Authenticate
            if (Object.keys(options?.tokens ?? {}).length || Object.keys(options?.users ?? {}).length) {
                await this.authenticate(trx.root, options?.tokens, options?.users as any)
            }

            // Run transaction
            const output = await fn(trx.root);
            
            // Commit transaction
            await this.ok(trx, output);
        }
        catch (e) {
            // Rollback transaction
            await this.error(trx, e);
        }
        return trx.status();
    }

    public async trx_child(
        parent: t_TrxNode,
        child_engine: TrxEngine<S, any, any>,
        fn: (trx: TrxNode<S, M, any>) => Promise<any>,
        options?: {
            no_inherit_auth?: boolean,
            idempotent?: boolean
        }
    ): Promise<TrxStatus<any>>  {
        // Ensure parent transaction is open and idempotency matches
        const state = (parent.trx.root as any as t_TrxNode).state;
        if (state !== 'open') {
            throw new Error(`Attempt to run child transaction of ${parent.globalId}, currently at '${state}', failed. Should be at 'open'. This might mean there are parallel attempts to open a transaction, which must be handled with a queue.`)
        }
        if (parent.trx.idempotent && !options?.idempotent) {
            throw new Error(`Attempt to run non-idempotent child on idempotent transaction ${parent.trx.id} failed.`)
        }

        // Get or create child transaction, then inherit auth from parent
        const child_trx = await child_engine.begin(`trx:${this.module.name}::${parent.trx.id}`, parent.trx, false);
        if (!options?.no_inherit_auth) {
            TrxNode.inheritAuth(parent.trx.root, child_trx.root);
        }

        // Pause parent transaction before starting child
        await this.pause(parent.trx.id);

        const tag = `${child_engine.module.name}::trx:${child_trx.id}`;
        let child_node = child_trx.root;
        try {
            // External transaction, create externals node
            if (this.module.name !== child_engine.module.name) {
                child_node = TrxNode.makeChildNode(parent as any as AnyTrxNode, this.module.name, 'externals', tag);
                TrxNode.open(child_node, '~', {
                    module: child_engine.module.name,
                    id: child_trx.id,
                    idempotent: options?.idempotent
                });
            }

            // Run child transaction
            const output = await fn(child_node);

            // Non-idempotent, add hold to parent, so child only commits
            // when the parent does.
            if (!options?.idempotent) {
                parent.trx.children[tag] = await child_engine.hold(child_trx.id, output);
            }
            // Idempotent, commit the child.
            else {
                await child_engine.ok(child_trx, output);
            }
        }
        catch (e) {
            // Child transaction failed, roll it back.
            await child_engine.error(child_trx, e);
        }

        // Merge children nodes into the parent node
        TrxNode.merge(parent as any as AnyTrxNode, child_trx.root);

        // Continue parent transaction
        await this.continue(child_trx.id);

        return child_trx.status();
    }

    /* Metadata sharing between modules */

    public getBucketReference(tag: Tag): BucketReference {
        return {
            query: this.module.buckets[tag.name].getQueryMeta(),
            schema: this.module.buckets[tag.name].schema,
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

    // lifecycle

    private async begin(
        origin: TrxOrigin,
        parent?: AnyTrx,
        idempotent?: boolean
    ) {
        const trx = new Trx(this, this.module, origin, parent?.root_id, parent, idempotent);
        Log.debug('module', this.module.name, `Begin${idempotent?'[r]':'[rw]'} ${scopeTag('trx', trx.root.globalId)} @ ${anyScopeTag(origin)}`);
        
        TrxNode.open(trx.root, 'root', {});
        
        for (const wrap of this.config?.wrap || []) {
            // The wrappers decide what to do when beginning a transaction
            // They can use the root_id and module info to ensure a single action per transaction tree
            await wrap.begin?.(trx, this.services);
        }

        this.ongoing[trx.id] = trx;
        return trx;
    }

    private async pause(
        id: string
    ) {
        const trx = this.ongoing[id];
        const state = (trx.root as any as t_TrxNode).state;

        Log.debug('module', this.module.name, `Pause ${scopeTag('trx', trx.root.globalId)}`);
        if (state !== 'open') {
            throw new Error(`Attempt to pause transaction ${this.ongoing[trx.id].id}, currently at '${state}', failed. Should be at 'open'. This might mean there are parallel attempts to pause a transaction, which must be handled with a queue.`)
        }

        TrxNode.pause(trx.root);

        for (const wrap of this.config?.wrap || []) {
            // The wrappers decide what to do when pausing a transaction
            // They can use the root_id and module info to ensure a single action per transaction tree
            await wrap.pause?.(trx, this.services);
        }

        return trx;
    }

    private async continue(
        id: string
    ) {
        const trx = this.ongoing[id];
        const state = (trx.root as any as t_TrxNode).state;

        Log.debug('module', this.module.name, `Continue${trx.idempotent?'[r]':'[rw]'} ${scopeTag('trx', trx.root.globalId)}`);
        if (state !== 'paused') {
            throw new Error(`Attempt to continue transaction ${trx.id}, currently at '${state}', failed. Should be at 'paused'. This might mean there are parallel attempts to continue a transaction, which must be handled with a queue.`)
        }

        TrxNode.continue(trx.root);
        
        for (const wrap of this.config?.wrap || []) {
            // The wrappers decide what to do when continuing a transaction
            // They can use the root_id and module info to ensure a single action per transaction tree
            await wrap.continue?.(trx, this.services);
        }
        
        return trx;
    }

    private async hold(id: string, output: any) {
        const trx = this.ongoing[id];
        const state = (trx.root as any as t_TrxNode).state;

        Log.debug('module', this.module.name, `OkHold ${scopeTag('trx', trx.root.globalId)}`);
        if (state !== 'open') {
            throw new Error(`Attempt to hold transaction ${trx.id}, currently at '${state}', failed. Should be at 'open'. This might mean there are parallel attempts to hold a transaction, which must be handled with a queue.`)
        }

        TrxNode.hold(trx.root, output);

        for (const wrap of this.config?.wrap || []) {
            // The wrappers decide what to do when holding a transaction
            // They can use the root_id and module info to ensure a single action per transaction tree
            await wrap.hold?.(trx, this.services);
        }
        
        return {
            id: trx.id,
            status: trx.status(),
            ok: () => this.ok(trx, output),
            error: (error: NesoiError.BaseError) => this.error(trx, error)
        }
    }

    private async ok(trx: Trx<S, M, any>, output: any) {
        Log.debug('module', this.module.name, `Ok${trx.idempotent?'[r]':'[rw]'} ${scopeTag('trx', trx.root.globalId)}`);
        TrxNode.ok(trx.root, output);
        trx.end = process.hrtime.bigint();

        try {
            for (const c in trx.children) {
                const child = trx.children[c];
                Log.debug('module', this.module.name, `Commit child trx ${scopeTag('trx', c)}`);
                await child.ok();
            }
        }
        catch (e: any) {
            Log.error('trx', trx.id, 'Failed to commit child transaction.', e);
        }

        try {
            Log.debug('module', this.module.name, `Commit ${scopeTag('trx', trx.root.globalId)}`);   
            for (const wrap of this.config?.wrap || []) {
                // The wrappers decide what to do when commiting a transaction
                // They can use the root_id and module info to ensure a single action per transaction tree
                await wrap.commit?.(trx, this.services);
            }

        }
        catch (e: any) {
            Log.error('trx', trx.id, 'Failed to commit transaction.', e);
        }

        if (!trx.parent) {
            if ((trx.idempotent && this.config?.log?.idempotent)
                || (!trx.idempotent && this.config?.log?.non_idempotent)) {
                await this.save_log(trx);
            }
        }
        
        delete this.ongoing[trx.id];
        return trx;
    }

    private async error(trx: Trx<S, M, any>, error: any) {
        Log.error('module', this.module.name, `[${error.status}]${trx.idempotent?'[r]':'[rw]'} ${error.toString()}`, error.stack);
        TrxNode.error(trx.root, error);
        trx.end = process.hrtime.bigint();

        try {
            for (const c in trx.children) {
                const child = trx.children[c];
                Log.debug('module', this.module.name, `Spread error to child trx ${scopeTag('trx', c)}`);
                await child.error(error);
            }
        }
        catch (e: any) {
            Log.error('trx', trx.id, 'Failed to rollback child transaction.', e);
        }

        try {
            Log.warn('module', this.module.name, `Rollback ${scopeTag('trx', trx.root.globalId)}`);
            for (const wrap of this.config?.wrap || []) {
                // The wrappers decide what to do when rolling back a transaction
                // They can use the root_id and module info to ensure a single action per transaction tree
                await wrap.rollback?.(trx, this.services);
            }
        }
        catch (e: any) {
            Log.error('trx', trx.id, 'Failed to rollback transaction.', e);
        }

        if (!trx.parent) {
            if ((trx.idempotent && this.config?.log?.idempotent)
                || (!trx.idempotent && this.config?.log?.non_idempotent)) {
                await this.save_log(trx);
            }
        }

        delete this.ongoing[trx.id];
        return trx;
    }

    private async save_log(trx: Trx<S, M, any>) {
        let data;
        const include = this.config!.log![trx.idempotent
            ? 'idempotent'
            : 'non_idempotent'
        ];
        if (include?.level === 'output') data = (trx.root as any).output as AnyTrxNode['output'];
        else if (include?.level === 'status') data = trx.status()

        const error = (trx.root as any).error as AnyTrxNode['error'];

        await this.log_adapter?.create(this.innerTrx.root, {
            trx_id: trx.id,
            idempotent: trx.idempotent,
            state: 'ok',
            origin: this.origin,
            start: trx.start,
            end: trx.end,
            module: this.module.name,
            data,
            error
        });
    }
}

export type AnyTrxEngine = TrxEngine<any, any, any>