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

export abstract class Daemon<
    S extends $Space,
    Modules extends ModuleName<S>
> {

    private _cli?: CLI;

    constructor(
        protected name: string,
        protected trxEngines: Record<Modules, AnyTrxEngine>,
        protected providers: Record<string, any>,
        protected app?: AnyAppConfig
    ) {
        this.bindControllers();
        Log.info('daemon', name, 'Woo-ha!');
    }

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

    async cli(cmd?: string) {
        this._cli = new CLI(this, this.app?.cli);
        await this._cli.run(cmd);
    }

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

    public static async destroy(
        daemon: AnyDaemon
    ) {
        Log.info('daemon', this.name, 'Stop');
        for (const key in daemon.providers) {
            const provider = daemon.providers[key]
            await provider.__down(provider)
            delete daemon.providers[key]
        }
        for (const key in daemon.trxEngines) {
            delete daemon.trxEngines[key]
        }
    }

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

    public static getModule<
        Modules extends ModuleName<any>,
        D extends Daemon<any, Modules>
    >(daemon: D, module: Modules) {
        return daemon.trxEngines[module].getModule();
    }

    public static getModules(daemon: AnyDaemon): AnyModule[] {
        return Object.values(daemon.trxEngines)
            .map((trx: any) => trx.getModule());
    }
}

export class DaemonTrx<
    S extends $Space,
    M extends $Module,
    Authn extends AnyUsers = {}
> {

    private _authn?: AuthnRequest<keyof S['authnUsers']>;

    constructor(
        private trxEngine: AnyTrxEngine
    ) {}

    authn<
        Authn extends AuthnRequest<keyof S['authnUsers']>
    >(
        authn?: Authn
    ) {
        this._authn = authn;
        return this as DaemonTrx<S, M, {
            [K in keyof Authn]: S['authnUsers'][K & keyof S['authnUsers']]
        }>;
    }

    async run<Output>(
        fn: (trx: TrxNode<S, M, Authn>) => Promise<Output>
    ): Promise<TrxStatus<Output>> {
        return this.trxEngine.trx(fn as any, this._authn);
    }

}

export type AnyDaemon = Daemon<any, any>