import { $Module, $Space } from '~/schema';
import { Module } from '../module';
import { Log, anyScopeTag, scopeTag } from '../util/log';
import { Trx } from './trx';
import { TrxNode, TrxNodeStatus } from './trx_node';
import { AnyAuthnProviders, AnyUsers, AuthnRequest } from '../auth/authn';
import { NesoiError } from '../data/error';
import { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { MemoryBucketAdapter } from '~/elements/entities/bucket/adapters/memory.bucket_adapter';
import { TrxEngineConfig } from './trx_engine.config';
import { IService } from '../apps/service';

/*
    Types
*/

export type TrxEngineOrigin = `app:${string}` | `plugin:${string}`;

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TrxEngine<
    S extends $Space,
    M extends $Module,
    Authn extends AnyAuthnProviders
> {

    /**
     * Transaction used to read/write transactions on the adapter
     */
    private innerTrx;
    private adapter: BucketAdapter<Trx<S, M, any>>;

    constructor(
        private origin: TrxEngineOrigin,
        private module: Module<S, M>,
        private authnProviders?: Authn,
        private config?: TrxEngineConfig<S, M, any, any>,
        private services: Record<string, IService> = {}
    ) {
        this.innerTrx = new Trx<S, M, any>(this, this.module, `trx:${origin}`);
        this.adapter = config?.adapter?.(module.schema) || new MemoryBucketAdapter<any, any>({} as any, {});
    }

    public getModule() {
        return this.module;
    }

    async get(id?: string) {
        let trx: Trx<S, M, any> | undefined = undefined;
        if (!id) {
            trx = new Trx(this, this.module, this.origin);
            Log.info('module', this.module.name, `Begin ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
            return this.adapter.create(this.innerTrx.root, trx);
        }
        else {
            trx = await this.adapter.get(this.innerTrx.root, id);
            if (trx) {
                Log.info('module', this.module.name, `Continue ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
            }
            else {
                Log.info('module', this.module.name, `Chain ${scopeTag('trx', id)} @ ${anyScopeTag(this.origin)}`);
                trx = new Trx(this, this.module, this.origin, undefined, id);
                return this.adapter.create(this.innerTrx.root, trx);
            }
        }
        return trx;
    }

    async trx(
        fn: (trx: TrxNode<S, M, any>) => Promise<TrxNodeStatus>,
        authn?: AuthnRequest<keyof Authn>
    ) {
        const trx = await this.get(undefined);
        try {
            await this.authenticate(trx.root, authn)

            let output;
            if (this.config?.wrap) {
                output = await this.config?.wrap(trx, fn, this.services);
            }
            else {
                output = await fn(trx.root);
            }
            await this.commit(trx, output);
        }
        catch (e) {
            await this.rollback(trx, e);
        }
        return trx.status();
    }

    // authentication

    public async authenticate(node: TrxNode<S, M, any>, request: AuthnRequest<keyof Authn> = {}) {
        if (!this.authnProviders) {
            throw NesoiError.Authn.NoProvidersRegisteredForModule(this.module.name);
        }
        const users = {} as AnyUsers;
        const tokens = {} as AuthnRequest<any>;
        for (const providerName in this.authnProviders) {
            const provider = this.authnProviders[providerName];
            const reqToken = request[providerName] as string | undefined;
            if (provider.eager || reqToken) {
                if (!provider) {
                    throw NesoiError.Authn.NoProviderRegisteredForModule(this.module.name, providerName);
                }
                const { user, token } = await provider.authenticate({ trx: node, token: reqToken });
                users[providerName] = user;
                tokens[providerName] = token;
            }
        }
        TrxNode.addAuthn(node, tokens, users);
    }

    //

    private async commit(trx: Trx<S, M, any>, output: any) {
        Log.info('module', this.module.name, `Commit ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
        await TrxNode.ok(trx.root, output);
        Trx.onFinish(trx);
        await this.adapter.put(this.innerTrx.root, trx);
        return trx;
    }

    private async rollback(trx: Trx<S, M, any>, error: any) {
        Log.error('module', this.module.name, `[${error.status}] ${error.toString()}`, error.stack);
        Log.warn('module', this.module.name, `Rollback ${scopeTag('trx', trx.id)} @ ${anyScopeTag(this.origin)}`);
        await TrxNode.error(trx.root, error);
        Trx.onFinish(trx);
        await this.adapter.put(this.innerTrx.root, trx);
        return trx;
    }
}

export type AnyTrxEngine = TrxEngine<any, any, any>