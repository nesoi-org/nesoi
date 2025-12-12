import type { AnyModule } from '../module';
import type { AnyTrx } from './trx';
import type { AnyBucketCache, BucketCache } from '~/elements/entities/bucket/cache/bucket_cache';
import type { NQLRunner } from '~/elements/entities/bucket/query/nql_engine';

import { NesoiError } from '../data/error';
import { Module } from '../module';
import { BucketTrxNode } from './nodes/bucket.trx_node';
import { JobTrxNode } from './nodes/job.trx_node';
import { QueueTrxNode } from './nodes/queue.trx_node';
import { ResourceTrxNode } from './nodes/resource.trx_node';
import { MessageParser } from '~/elements/entities/message/message_parser';
import { MachineTrxNode } from './nodes/machine.trx_node';
import { Enum } from '~/elements/entities/constants/constants';
import { i18n } from '../util/i18n';
import { NesoiDatetime } from '../data/datetime';
import { TopicTrxNode } from './nodes/topic.trx_node';
import { Tag } from '../dependency';
import { Log } from '../util/log';
import type { AnyUsers, AuthRequest } from '../auth/authn';
import type { $Space, $Module, $Message, VirtualModuleDef, $BlockAuth } from 'index';

/*
    Types
*/

export type TrxNodeBlock = 'bucket' | 'message' | 'job' | 'resource' | 'machine' | 'queue' | 'topic' | 'controller' | 'externals'
export type TrxNodeState = 'open' | 'hold' | 'ok' | 'error'

export type TrxNodeStatus = {
    id: string
    scope: 'root' | `${string}::${TrxNodeBlock}:${string}` | `${string}::virtual`
    state?: TrxNodeState
    action?: string
    input?: Record<string, any>
    output?: Record<string, any>
    error?: NesoiError.BaseError
    cached_buckets: number
    nodes: TrxNodeStatus[]
    app: number
    ext?: {
        idempotent: boolean
    }
}

/*
    Transaction Node
*/

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TrxNode<Space extends $Space, M extends $Module, AuthUsers extends AnyUsers> {

    public id: string;
    public globalId: string;

    private children: AnyTrxNode[] = [];

    private state?: TrxNodeState;
    private action?: string;
    private input?: Record<string, any>;
    private output?: Record<string, any>;
    private error?: NesoiError.BaseError;

    public cache_config: Record<string, 'eager'> = {};
    public _cache: Record<string, AnyBucketCache> = {};

    private time = {
        start: NesoiDatetime.now(),
        hold: undefined as NesoiDatetime | undefined,
        end: undefined as NesoiDatetime | undefined
    }
    
    constructor(
        private scope: 'root' | `${string}::${TrxNodeBlock}:${string}` | `${string}::virtual`,
        private trx: AnyTrx,
        private parent: AnyTrxNode | undefined,
        private module: AnyModule,
        private auth?: {
            tokens: AuthRequest<any>,
            users: AuthUsers
        },
        private external?: boolean
    ) {
        this.id = parent
            ? (Math.random() + 1).toString(36).substring(7)
            : '#';
        this.globalId = `${this.trx.id}.${this.id}`;
    }

    static open(node: AnyTrxNode, action: string, input: Record<string, any>) {
        node.state = 'open';
        node.action = action;
        node.input = input;
    }
    
    static hold(node: AnyTrxNode, output?: Record<string, any>) {
        node.state = 'ok';
        node.output = output;
        node.time.hold = NesoiDatetime.now();
    }
    
    static ok(node: AnyTrxNode, output?: Record<string, any>) {
        node.state = 'ok';
        node.output = output;
        node.time.end = NesoiDatetime.now();
    }
    
    static error(node: AnyTrxNode, error: any) {
        node.state = 'error';
        if (error instanceof NesoiError.BaseError) {
            error.message = i18n.error(error, node.trx.root.module.daemon);
        }
        else {
            const _e = error;
            error = new NesoiError.BaseError('UnknownError', _e.message);
            error.stack = _e.stack;
        }
        node.error = error;
        node.time.end = NesoiDatetime.now();
        return error;
    }

    // Entities

    public async message<
        Raw extends M['#input']['#raw'],
        Msg extends $Message = M['messages'][Raw['$'] & keyof M['messages']]
    >(raw: Raw): Promise<M['#input']['#parsed']> {
        const node = TrxNode.makeChildNode(this, this.module.name, 'message', raw.$ as string);
        TrxNode.open(node, 'parse', raw);
        try {
            const parsed = await MessageParser.parseWithTrxModule(
                node,
                raw
            );
            TrxNode.ok(node);
            return parsed;
        }
        catch (e) {
            TrxNode.error(node, e as any);
            throw e;
        }
    }

    public value<
        K extends keyof M['constants']['values']
    >(name: K): M['constants']['values'][K]['value'] {
        const tag = Tag.fromNameOrShort(this.module.name, 'constants.value', name as string);
        // (External values have been injected during build as static externals)
        const key = tag.module !== this.module.name
            ? tag.short
            : tag.name;
        return this.module.schema.constants.values[key].value;
    }

    public enum<
        EnumName extends keyof M['constants']['enums']
    >(name: EnumName): Enum<M['constants']['enums'][EnumName]> {
        const tag = Tag.fromNameOrShort(this.module.name, 'constants.value', name as string);
        // (External enums have been injected during build as static externals)
        const key = tag.module !== this.module.name
            ? tag.short
            : tag.name;
        const schema = this.module.schema.constants.enums[key as string];
        if (!schema) {
            throw NesoiError.Module.EnumNotFound(this.module, key as string);
        }
        return new Enum<
            M['constants']['enums'][EnumName]
        >(this.module.schema.constants.enums[key as string] as any);
    }

    /*
        Cache
    */

    cache(config: Partial<Record<keyof M['buckets'], 'eager'>>) {
        this.cache_config = {};
        for (const key in config) {
            const tag = Tag.fromNameOrShort(this.module.name, 'bucket', key);
            this.cache_config[tag.short] = config[key]!;
        }
        return this;
    }

    // Blocks

    public bucket<
        Name extends keyof M['buckets'],
        Bucket extends M['buckets'][Name]
    >(name: Name): BucketTrxNode<M, Bucket> {
        const tag = Tag.fromNameOrShort(this.module.name, 'bucket', name as string);
        return new BucketTrxNode(this, tag);
    }

    public job<
        Name extends keyof M['jobs'],
        Job extends M['jobs'][Name]
    >(name: Name): JobTrxNode<M, Job> {
        const tag = Tag.fromNameOrShort(this.module.name, 'job', name as string);
        return new JobTrxNode(this, tag);
    }

    // Method for internal use, which allows running a job with a custom context.
    // This is used by composite blocks to pass things such as an object
    // or the previous/next machine states along with the message.
    public static jobWithCustomCtx<
        M extends $Module,
        JobName extends keyof M['jobs'],
        Job extends M['jobs'][JobName]
    >(node: AnyTrxNode, name: string, ctx?: Record<string, any>): JobTrxNode<M, Job> {
        const tag = Tag.fromNameOrShort(node.module.name, 'job', name as string);
        return new JobTrxNode(node, tag, ctx);
    }

    public resource<
        Name extends keyof M['resources'],
        Resource extends M['resources'][Name]
    >(name: Name): ResourceTrxNode<M, Resource> {
        const tag = Tag.fromNameOrShort(this.module.name, 'resource', name as string);
        return new ResourceTrxNode(this, tag);
    }

    public machine<
        Name extends keyof M['machines'],
        Machine extends M['machines'][Name]
    >(name: Name): MachineTrxNode<M, Machine> {
        const tag = Tag.fromNameOrShort(this.module.name, 'machine', name as string);
        return new MachineTrxNode(this, tag);
    }

    public queue<
        Name extends keyof M['queues'],
        Queue extends M['queues'][Name]
    >(name: Name): QueueTrxNode<M, Queue> {
        const tag = Tag.fromNameOrShort(this.module.name, 'queue', name as string);
        return new QueueTrxNode(this, tag);
    }

    public topic<
        Name extends keyof M['topics'],
        topic extends M['topics'][Name]
    >(name: Name): TopicTrxNode<M, topic> {
        const tag = Tag.fromNameOrShort(this.module.name, 'topic', name as string);
        return new TopicTrxNode(this, tag);
    }

    // Authentication

    public async authenticate(
        tokens: AuthRequest<keyof AuthUsers>
    ) {
        const newNode = new TrxNode(this.scope, this.trx, this, this.module, this.auth);
        await this.trx.engine.authenticate(newNode, tokens);
        return newNode;
    }

    public async token<
        U extends keyof M['#auth']
    >(provider: U): Promise<string> {
        return this.auth?.tokens[provider as keyof typeof this.auth.tokens] as any;
    }

    public async user<
        U extends keyof AuthUsers & keyof M['#auth']
    >(...providers: U[]): Promise<M['#auth'][U]> {
        const provider = await TrxNode.checkAuth(this, providers.map(p => ({ provider: p as string })));
        return this.auth?.users[provider as keyof typeof this.auth.users] as any;
    }

    // Virtual Module Transaction

    public async virtual<T>(
        def: VirtualModuleDef,
        fn: ($: AnyTrxNode) => T | Promise<T>
    ): Promise<T> {
        if (!this.module.daemon) {
            throw new Error(`Internal Error: unable to reach nesoi daemon when building virtual module '${def.name}'`)
        }

        // Build virtual module
        const virtualModule = await Module.virtual(this.module.daemon, def);

        // Create trx node of virtual module
        const node = TrxNode.makeVirtualChildNode(this, virtualModule);
        TrxNode.open(node, 'run', {});
        try {
            const result = await fn(node);
            TrxNode.ok(node);
            return result;
        }
        catch (e) {
            TrxNode.error(node, e);
            throw e;
        }
    }

    // Status

    public status(): TrxNodeStatus {
        return {
            id: this.globalId,
            scope: this.scope,
            state: this.state,
            action: this.action,
            input: this.input,
            output: this.output,
            error: this.error,
            cached_buckets: Object.keys(this._cache).length,
            nodes: this.children.map(child => child.status()),
            app: this.time.end ? (this.time.end.epoch - this.time.start.epoch) : -1,
            ext: this.action === '~' ? {
                idempotent: this.input?.idempotent
            } : undefined
        };
    }

    //

    static merge<Space extends $Space, M extends $Module, AuthUsers extends AnyUsers>(
        to: TrxNode<Space, M, AuthUsers>,
        from: TrxNode<Space, M, AuthUsers>
    ) {
        for (const child of from.children) {
            to.children.push(child);
            to.trx.addNode(child);
        }
        to.input = {
            idempotent: from.trx.idempotent
        }
    }

    static makeChildNode<Space extends $Space, M extends $Module, AuthUsers extends AnyUsers>(
        node: TrxNode<Space, M, AuthUsers>,
        module: string,
        block: TrxNodeBlock,
        name: string
    ) {
        const child = new TrxNode<Space, M, AuthUsers>(`${module}::${block}:${name}`, node.trx, node, node.module, node.auth);
        child._cache = node._cache;
        node.children.push(child);
        node.trx.addNode(child);
        return child;
    }

    static makeVirtualChildNode<Space extends $Space, M extends $Module, AuthUsers extends AnyUsers>(
        node: TrxNode<Space, M, AuthUsers>,
        module: AnyModule,
    ) {
        const child = new TrxNode<Space, M, AuthUsers>(`${module.name}::virtual`, node.trx, node, module, node.auth);
        node.children.push(child);
        node.trx.addNode(child);
        return child;
    }

    static addAuthn(node: AnyTrxNode, tokens: AuthRequest<any>, users: AnyUsers) {
        Log.trace('trx', node.globalId, 'Transaction authenticated', {
            tokens,
            users
        });
        node.auth ??= {
            tokens: {},
            users: {}
        };
        node.auth.tokens ??= {};
        node.auth.users ??= {};
        Object.assign(node.auth.tokens, tokens);
        Object.assign(node.auth.users, users);
    }

    static getModule(node: AnyTrxNode) {
        return node.module;
    }

    static getFirstUserMatch(node: AnyTrxNode, authnProviders?: Record<string, any>) {
        if (!authnProviders)
            return undefined;
        for (const provider in authnProviders) {
            const user = node.auth?.users[provider];
            if (user) {
                return { provider, user };
            }
        }
        return undefined;
    }


    static getCacheCustomBuckets(node: AnyTrxNode) {    
        const buckets: Record<string, {
                scope: string,
                nql: NQLRunner
            }> = {};
        for (const tag in node._cache) {
            const adapter = (node._cache[tag] as any).innerAdapter as BucketCache<any>['innerAdapter'];
            buckets[tag] = {
                scope: `__cache_${tag}`,
                nql: adapter.nql
            }
        }
    
        return buckets;
    }

    static async checkAuth(node: AnyTrxNode, options?: $BlockAuth[]) {
        if (!options?.length)
            return;
        if (!node.auth || !Object.keys(node.auth?.tokens || {}).length) {
            throw NesoiError.Trx.Unauthorized({ providers: options.map(opt => opt.provider) });
        }
        const users = node.auth.users;
        const tokens = node.auth.tokens;
        for (const opt of options) {
            // Eager provider or previously authenticated user
            if (opt.provider in users) {
                const user = users[opt.provider];

                if (opt.resolver && !opt.resolver(user)) {
                    Log.debug('trx', node.globalId, `User from provider '${opt.provider}' didn't pass the authorization resolver`);
                    continue;
                }
                
                Log.debug('trx', node.globalId, `User from provider '${opt.provider}' pre-authenticated${opt.resolver ? ' and authorized' : ''}`);
                return opt.provider;
            }
            // Non-eager providers
            else if (opt.provider in tokens) {
                try {
                    await node.trx.engine.authenticate(node, {
                        [opt.provider]: tokens[opt.provider]
                    }, {}, true);
                }
                catch {
                    Log.debug('trx', node.globalId, `Attempt to authenticate with provider '${opt.provider}' failed`)
                    continue;
                }
                
                const user = users[opt.provider];
                if (opt.resolver && !opt.resolver(user)) {
                    Log.debug('trx', node.globalId, `User from provider '${opt.provider}' didn't pass the authorization resolver`);
                    continue;
                }

                Log.debug('trx', node.globalId, `User from provider '${opt.provider}' authenticated${opt.resolver ? ' and authorized' : ''}`);
                return opt.provider;
            }
        }
        throw NesoiError.Trx.Unauthorized({ providers: options.map(opt => opt.provider) });
    }

}

export type AnyTrxNode = TrxNode<any, any, any>