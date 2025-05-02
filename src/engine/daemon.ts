import { $Module, $Space } from '~/elements';
import { ModuleName } from '~/schema';
import { AnyTrxEngine } from './transaction/trx_engine';
import { AnyAppConfig } from './apps/app.config';
import { Log } from './util/log';
import { NesoiError } from './data/error';
import { AnyUsers, AuthnRequest } from './auth/authn';
import { TrxNode } from './transaction/trx_node';
import { TrxStatus } from './transaction/trx';
import { CLI } from './cli/cli';
import { AnyModule } from './module';
import { AnyAppProvider } from './apps/app';

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
     * @param providers A dictionary of App Provider by name
     * @param config Optional `AppConfig`
     */
    constructor(
        protected name: string,
        protected trxEngines: Record<Modules, AnyTrxEngine>,
        protected providers: Record<string, AnyAppProvider>,
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
        const cli = new CLI(this, this.config?.cli);
        await cli.run(cmd);
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
     * Destroy the providers and transaction engines of this daemon
     * 
     * @param A `Daemon` instance
     */
    public static async destroy(
        daemon: AnyDaemon
    ) {
        Log.info('daemon', this.name, 'Stop');
        for (const key in daemon.providers) {
            const provider = daemon.providers[key]
            await provider.down(provider)
            delete daemon.providers[key]
        }
        for (const key in daemon.trxEngines) {
            delete daemon.trxEngines[key]
        }
    }

    /**
     * Replace the providers and transaction engines of this daemon
     * and rebind the controllers
     * 
     * @param daemon A `Daemon` instance
     * @param trxEngines A dictionary of Transaction Engine by module name
     * @param providers A dictionary of App Provider by name
     */
    public static reload(
        daemon: AnyDaemon,
        trxEngines: Record<string, AnyTrxEngine>,
        providers: Record<string, any>
    ) {
        Log.info('daemon', this.name, 'Reloaded');
        daemon.trxEngines = trxEngines
        daemon.providers = providers
        daemon.bindControllers();
    }

    /**
     * Return a `Daemon` property.
     * This is used to read private properties.
     * 
     * @param daemon A `Daemon` instance
     * @param key A `Daemon` property `'name'|'providers'|'app'`
     * @returns The selected property
     */
    public static get<
        T extends {
            name: string,
            providers: Record<string, any>,
            app: AnyAppConfig
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
    Authn extends AnyUsers = {}
> {

    /**
     * The authentication request which will be used to
     * authenticate this transaction prior to running.
     */
    private authnRequest?: AuthnRequest<keyof S['authnUsers']>;

    /**
     * @param trxEngine The transaction engine where to run the transaction.
     */
    constructor(
        private trxEngine: AnyTrxEngine
    ) {}

    /**
     * Authenticate the transaction with the given credentials.
     * You can specify one or more credentials, so the transaction
     * is able to access elements with different authn providers.
     */
    authn<
        Authn extends AuthnRequest<keyof S['authnUsers']>
    >(
        authn?: Authn
    ) {
        this.authnRequest = authn;
        return this as DaemonTrx<S, M, {
            [K in keyof Authn]: S['authnUsers'][K & keyof S['authnUsers']]
        }>;
    }

    /**
     * Run a method inside the transaction.
     * 
     * @param fn A function to execute inside the transaction
     * @returns A `TrxStatus` containing metadata about the transaction and the function response
     */
    async run<Output>(
        fn: (trx: TrxNode<S, M, Authn>) => Promise<Output>
    ): Promise<TrxStatus<Output>> {
        return this.trxEngine.trx(fn as any, this.authnRequest);
    }

}

export type AnyDaemon = Daemon<any, any>