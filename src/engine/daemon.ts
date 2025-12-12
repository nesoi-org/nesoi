import type { ModuleName } from '~/schema';
import type { AnyTrxEngine, BucketReference, HeldTrxNode } from './transaction/trx_engine';
import type { AnyAppConfig } from './app/app.config';
import type { AnyUsers, AuthRequest } from './auth/authn';
import type { AnyTrxNode, TrxNode } from './transaction/trx_node';
import type { TrxStatus } from './transaction/trx';
import type { AnyModule } from './module';
import type { IService } from './app/service';
import type { $Space, Tag, $Module } from 'index';

import { Log } from './util/log';
import { NesoiError } from './data/error';

/* @nesoi:browser ignore-start */
import { CLI } from './cli/cli';
/* @nesoi:browser ignore-end */

/**
 * A background process running one or more modules,
 * which runs _Transactions_ for the available elements.
 * 
 * A `Daemon` is spawn by an `App`.
 * 
 * @category Engine
 */
export abstract class Daemon<
    S extends $Space,
    Modules extends ModuleName<S>
> {
    /**
     * @param name Name of the daemon (taken from App)
     * @param trxEngines A dictionary of Transaction Engine by module name
     * @param services A dictionary of Service by name
     * @param config Optional `AppConfig`
     */
    constructor(
        protected name: string,
        protected trxEngines: Record<Modules, AnyTrxEngine>,
        protected services: Record<string, IService>,
        protected config?: AnyAppConfig
    ) {
        this.bindControllers();
        Log.info('daemon', name, 'Woo-ha!');
    }

    /**
     * Prepare a transaction to be run by the Daemon.
     * 
     * @param moduleName Name of the module where to run the transactoin
     * @returns A `DaemonTrx` instance, which can be run
     */
    trx<
        K extends Modules & keyof S['modules']
    >(
        moduleName: K,
    ) {
        const trxEngine = this.trxEngines[moduleName];
        if (!trxEngine) {
            throw NesoiError.Trx.ModuleNotFound(moduleName as string);
        }
        return new DaemonTrx<S, S['modules'][K]>(trxEngine);
    }

    /**
     * Run the Nesoi CLI for this Daemon.
     */
    async cli(cmd?: string) {
        /* @nesoi:browser ignore-start */
        const cli = new CLI(this, this.config?.cli);
        await cli.run(cmd);
        /* @nesoi:browser ignore-end */
        /* @nesoi:browser add
            throw new Exception('CLI not supported on Browser');        
        */
    }

    /**
     * Bind the controller of each module to this Daemon.
     * This allows the registered `Controller Adapters` to run
     * transactions on the daemon.
     */
    private bindControllers() {
        Log.info('daemon', this.name, 'Binding controllers');
        for (const t in this.trxEngines) {
            const module = this.trxEngines[t].getModule();
            for (const c in module.controllers) {
                const controller = module.controllers[c];
                controller.bind(this);
            }
        }
    }

    /**
     * Destroy the services and transaction engines of this daemon
     * 
     * @param A `Daemon` instance
     */
    public async destroy() {
        Log.info('daemon', this.name, 'Stop');
        for (const key in this.services) {
            const service = this.services[key]
            await service.down()
            delete this.services[key]
        }
        for (const key in this.trxEngines) {
            delete this.trxEngines[key]
        }
    }

    /**
     * Replace the services and transaction engines of this daemon
     * and rebind the controllers
     * 
     * @param daemon A `Daemon` instance
     * @param trxEngines A dictionary of Transaction Engine by module name
     * @param services A dictionary of Service by name
     */
    public reload(
        trxEngines: Record<Modules, AnyTrxEngine>,
        services: Record<string, any>
    ) {
        Log.info('daemon', this.name, 'Reloaded');
        this.trxEngines = trxEngines
        this.services = services
        this.bindControllers();
    }

    /**
     * Return a `Daemon` property.
     * This is used to read private properties.
     * 
     * @param daemon A `Daemon` instance
     * @param key A `Daemon` property `'name'|'services'|'app'`
     * @returns The selected property
     */
    public static get<
        T extends {
            name: string,
            services: Record<string, any>,
            config: AnyAppConfig
        },
        K extends keyof T
    >(daemon: AnyDaemon | undefined, key: K): T[K] {
        return (daemon as any)?.[key];
    }

    /**
     * Return one module of the `Daemon` by name.
     * 
     * @param daemon A `Daemon` instance
     * @param module A module name
     * @returns The `Module` instance
     */
    public static getModule<
        Module extends ModuleName<any>,
        D extends Daemon<any, Module>
    >(daemon: D, module: Module) {
        return daemon.trxEngines[module].getModule();
    }

    /**
     * Return the metadata of a bucket
     * 
     * @param daemon A `Daemon` instance
     * @param module A module name
     * @returns The `Module` instance
     */
    public static getBucketReference<
        Module extends ModuleName<any>,
        D extends Daemon<any, Module>
    >(fromModuleName: string, daemon: D, tag: Tag): Promise<BucketReference> {

        const fromTrxEngine = daemon.trxEngines[fromModuleName as Module];
        const fromModule = (fromTrxEngine as any).module as AnyTrxEngine['module'];

        if (fromModuleName !== tag.module) {
            if (!(tag.short in fromModule.schema.externals.buckets)) {
                throw new Error(`Not allowed to reference bucket ${tag.short} from module ${fromModuleName}. Did you forget to include it on the module externals?`)
            }
        }

        const trxEngine = daemon.trxEngines[tag.module as Module];
        return Promise.resolve(trxEngine.getBucketReference(tag));
    }

    /**
     * Return the metadata of a bucket
     * 
     * @param daemon A `Daemon` instance
     * @param module A module name
     * @returns The `Module` instance
     */
    public static getBucketDrive<
        Module extends ModuleName<any>,
        D extends Daemon<any, Module>
    >(daemon: D, tag: Tag) {
        const trxEngine = daemon.trxEngines[tag.module as Module];
        return trxEngine.getBucketDrive(tag);
    }

    /**
     * Return all modules of the `Daemon`.
     * 
     * @param daemon A `Daemon` instance
     * @returns The `Module` instances
     */
    public static getModules(daemon: AnyDaemon): AnyModule[] {
        return Object.values(daemon.trxEngines)
            .map((trx: any) => trx.getModule());
    }
}

/**
 * A helper class for preparing a transaction to be run.
 * It allows declaring authentication data before running
 * the transaction.
 * 
 * @category Engine
 */
export class DaemonTrx<
    S extends $Space,
    M extends $Module,
    AuthUsers extends AnyUsers = {}
> {

    /**
     * The node from which this transaction was inherited
     */
    private _inherit?: AnyTrxNode;

    /**
     * The authentication request which will be used to
     * authenticate this transaction prior to running.
     */
    private tokens?: AuthRequest<keyof S['users']>;

    /**
     * 
     */
    private _origin?: string;

    /**
     * @param trxEngine The transaction engine where to run the transaction.
     */
    constructor(
        private trxEngine: AnyTrxEngine
    ) {}

    origin(origin: string) {
        this._origin = origin;
        return this;
    }

    /**
     * Inherit authentication from another transaction node.
     */
    auth_inherit(
        trx: AnyTrxNode
    ) {
        this._inherit = trx;
        return this;
    }

    /**
     * Authenticate/authorize the transaction with the given credentials.
     * You can specify one or more credentials, so the transaction
     * is able to access elements with different authn providers.
     */
    auth<
        Auth extends AuthRequest<keyof S['users']>
    >(
        tokens?: Auth
    ) {
        this.tokens = tokens;
        return this as DaemonTrx<S, M, {
            [K in keyof Auth]: S['users'][K & keyof S['users']]
        }>;
    }

    /**
     * Run a method inside the transaction.
     * 
     * @param fn A function to execute inside the transaction
     * @returns A `TrxStatus` containing metadata about the transaction and the function response
     */
    run<Output>(
        fn: (trx: TrxNode<S, M, AuthUsers>) => Promise<Output>,
        id?: string,
        idempotent?: boolean
    ): Promise<TrxStatus<Output>> {
        const inheritedAuth = (this._inherit as any)?.auth as AnyTrxNode['auth'];
        const tokens = {
            ...inheritedAuth?.tokens,
            ...this.tokens
        };
        const users = inheritedAuth?.users;
        return this.trxEngine.trx(fn as any, id, tokens, users, this._origin, idempotent);
    }

    /**
     * Run a method inside the transaction, and hold it until
     * the external caller decides to commit.
     * 
     * @param fn A function to execute inside the transaction
     * @returns A `TrxStatus` containing metadata about the transaction and the function response
     */
    async run_and_hold<Output>(
        fn: (trx: TrxNode<S, M, AuthUsers>) => Promise<Output>,
        id?: string
    ): Promise<HeldTrxNode<Output>> {
        const inheritedAuth = (this._inherit as any).auth as AnyTrxNode['auth'];
        const tokens = {
            ...inheritedAuth?.tokens,
            ...this.tokens
        };
        const users = inheritedAuth?.users;
        return this.trxEngine.trx_hold(fn as any, id, tokens, users, this._origin);
    }

}


export type AnyDaemon = Daemon<any, any>