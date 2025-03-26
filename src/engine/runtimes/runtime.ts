import { $Module, $Space, ModuleName } from '~/schema';
import { AnyBuilder, AnyModule, Module } from '../module';
import { Space } from '../space';
import { BucketConfig } from '~/elements/entities/bucket/bucket.config';
import { AnyUsers, AuthnProvider, AuthnRequest } from '../auth/authn';
import { NesoiError } from '../data/error';
import { AnyTrxEngine } from '../transaction/trx_engine';
import { Log } from '../util/log';
import { TrxNode } from '../transaction/trx_node';
import { TrxStatus } from '../transaction/trx';
import { ControllerConfig } from '~/elements/edge/controller/controller.config';
import { MonolythCompilerConfig } from '~/compiler/runtimes/monolyth/monolyth_compiler';
import { TrxEngineConfig } from '../transaction/trx_engine.config';

/*
    Configs
*/

export type RuntimeConfig<
    S extends $Space,
    Modules extends ModuleName<S>
> = {
    i18n?: RuntimeI18nConfig
    authn?: RuntimeAuthnConfig<S>
    buckets?: RuntimeBucketConfig<S, Modules, any>
    controllers?: RuntimeControllerConfig<S, Modules, any>
    compiler?: MonolythCompilerConfig
    trxEngine?: RuntimeTrxEngineConfig<S, Modules, any>
}

export type RuntimeI18nConfig = {
    [x: string]: ($: Record<string, any>) => string
}

export type RuntimeAuthnConfig<
    S extends $Space
> = { [K in keyof S['authnUsers']]: AuthnProvider<S['authnUsers'][K]> }

export type RuntimeBucketConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Providers extends Record<string, any>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: Partial<{
        [K in keyof S['modules'][M]['buckets']]: BucketConfig<S['modules'][M]['buckets'][K], Providers>
    }>
}>
export type RuntimeControllerConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Providers extends Record<string, any>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: Partial<{
        [K in keyof S['modules'][M]['controllers']]: ControllerConfig<S['modules'][M]['controllers'][K], Providers>
    }>
}>
export type RuntimeTrxEngineConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Providers extends Record<string, any>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: TrxEngineConfig<S, S['modules'][M], any, Providers>
}>


/*
    Runtime
*/

export abstract class Runtime<
    S extends $Space,
    Modules extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> {

    protected _spaceModuleNames: ModuleName<S>[] = [];
    protected _injectedModules: AnyModule[] = [];

    protected _providers: Record<string, {
        up: ($: {
            modules: Record<string, AnyModule>
        }) => any
        down: (provider: any) => any
    }> = {};

    protected _config: RuntimeConfig<any, any> = {};

    // The space is only defined when running live or building projects.
    // A runtime can be created without a space, so prebuilt modules are used.
    // The compiler replaces the first argument for `new __Runtime()` with undefined.
    protected space?: Space<S>
    protected builders?: AnyBuilder[]

    constructor(
        public name: string,
        boot?: {
            space: Space<S>
        } | {
            builders: AnyBuilder[]
        }
    ) {
        if (boot) {
            if ('space' in boot) {
                this.space = boot.space;
            }
            else {
                this.builders = boot.builders;
            }
        }
    }

    public modules<M extends ModuleName<S>>(modules: M[]) {
        this._spaceModuleNames = modules as never;
        return this as Runtime<S, M & Modules>;
    }

    public inject(modules: AnyModule[]) {
        this._injectedModules = modules;
        return this;
    }

    //
    public provider<
        Name extends string,
        T
    >($: {
        name: Name,
        up: ($: {
            modules: Record<string, AnyModule>
        }) => T,
        down: (provider: T) => any,
    }) {
        this._providers[$.name] = $;
        return this as Runtime<S, Modules, Providers & {
            [K in Name]: T
        }>
    }

    //

    public get config() {
        return {
            i18n: this.configI18n.bind(this),
            authn: this.configAuthn.bind(this),
            buckets: this.configBuckets.bind(this),
            controllers: this.configControllers.bind(this),
            compiler: this.configCompiler.bind(this),
            trx: this.configTrx.bind(this),
        }
    }

    protected configI18n(i18n: RuntimeI18nConfig) {
        this._config.i18n = i18n;
        return this as Runtime<S, Modules, Providers>;
    }

    protected configAuthn(authn: RuntimeAuthnConfig<S>) {
        this._config.authn = authn;
        return this as Runtime<S, Modules, Providers>;
    }

    protected configBuckets(buckets: RuntimeBucketConfig<S, Modules, Providers>) {
        this._config.buckets = buckets as never;
        return this as Runtime<S, Modules, Providers>;
    }

    protected configControllers(controllers: RuntimeControllerConfig<S, Modules, Providers>) {
        this._config.controllers = controllers as never;
        return this as Runtime<S, Modules, Providers>;
    }

    protected configCompiler(compiler: MonolythCompilerConfig) {
        this._config.compiler = compiler;
        return this as Runtime<S, Modules, Providers>;
    }

    protected configTrx(trxEngine: RuntimeTrxEngineConfig<S, Modules, Providers>) {
        this._config.trxEngine = trxEngine;
        return this as Runtime<S, Modules, Providers>;
    }

    // 

    protected makeModules() {
        const modules = {} as Record<string, AnyModule>;
        if (this.space) {
            Space.scan(this.space, (name, path) => {
                if (this._spaceModuleNames.includes(name)) {
                    modules[name] = new Module(name, { path });
                }
            })
        }
        else {
            const buildersByModule: Record<string, AnyBuilder[]> = {};
            (this.builders || []).forEach(builder => {
                const module = (builder as any).module;
                buildersByModule[module] ||= [];
                buildersByModule[module].push(builder);
            })
            Object.entries(buildersByModule).forEach(([name, builders]) => {
                modules[name] = new Module(name, { builders });
            })
        }
        return modules;
    }

    /**
     * Scan the space for modules and their elements,
     * then build all schemas.
     * This can be run without await before the daemon,
     * to preload the module in background.
     */
    public abstract boot(): Runtime<S, Modules, Providers>

    /**
     * Spawn a daemon for this runtime.
     */
    public abstract daemon(): Promise<Daemon<S, Modules>>

    public static getInfo(runtime: AnyRuntime) {
        return {
            modules: runtime._spaceModuleNames,
            config: runtime._config
        }
    }
}

/*
    Daemon
*/

export abstract class Daemon<
    S extends $Space,
    Modules extends ModuleName<S>
> {

    constructor(
        // protected space: Space<S>,
        public name: string,
        protected trxEngines: Record<Modules, AnyTrxEngine>,
        protected providers: Record<string, any>,
        public i18n?: RuntimeI18nConfig
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

    public static getModule<
        Modules extends ModuleName<any>,
        D extends Daemon<any, Modules>
    >(daemon: D, module: Modules) {
        return daemon.trxEngines[module].getModule();
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
        authn: Authn
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

export type AnyRuntime = Runtime<any, any>
export type AnyDaemon = Daemon<any, any>