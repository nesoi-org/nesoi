import { $Space, ModuleName } from '~/schema';
import { Daemon, AppAuthnConfig, AppBucketConfig, AppControllerConfig, AppI18nConfig, AppTrxEngineConfig } from './app';
import { InlineApp } from './inline.app';
import { MonolythCLI } from './monolyth.cli';
import { AnyTrxEngine } from '../transaction/trx_engine';
import { Space } from '../space';
import { MonolythCompilerConfig } from '~/compiler/apps/monolyth/monolyth_compiler';
import { AnyModule } from '../module';

export class MonolythApp<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> extends InlineApp<S, ModuleNames, Providers> {

    constructor(
        name: string,
        space?: Space<S>
    ) {
        super(name, []);
        this.builders = undefined;
        this.space = space;
    }

    protected _packageJson?: Record<string, any>;

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as MonolythApp<S, M & ModuleNames>;
    }

    public provider<
        Name extends string,
        T
    >($: {
        name: Name,
        up: ($: {
            modules: Record<string, AnyModule>
        }) => T
        down: (provider: T) => any
    }) {
        super.provider($);
        return this as MonolythApp<S, ModuleNames, Providers & {
            [K in Name]: T
        }>
    }

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

    protected configI18n(i18n: AppI18nConfig) {
        super.configI18n(i18n);
        return this as MonolythApp<S, ModuleNames, Providers>;
    }

    protected configAuthn(authn: AppAuthnConfig<S>) {
        super.configAuthn(authn);
        return this as MonolythApp<S, ModuleNames, Providers>;
    }

    protected configBuckets(buckets: AppBucketConfig<S, ModuleNames, Providers>) {
        super.configBuckets(buckets);
        return this as MonolythApp<S, ModuleNames, Providers>;
    }

    protected configControllers(controllers: AppControllerConfig<S, ModuleNames, Providers>) {
        super.configControllers(controllers);
        return this as MonolythApp<S, ModuleNames, Providers>;
    }

    protected configCompiler(compiler: MonolythCompilerConfig) {
        this._config.compiler = compiler;
        return this as MonolythApp<S, ModuleNames, Providers>;
    }

    protected configTrx(trxEngine: AppTrxEngineConfig<S, ModuleNames, Providers>) {
        super.configTrx(trxEngine as any);
        return this as MonolythApp<S, ModuleNames, Providers>;
    }

    public boot(): MonolythApp<S, ModuleNames, Providers> {
        return super.boot() as any;
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, providers: Record<string, any>) {
        return new MonolythDaemon(/*this.space,*/ this.name, trxEngines, providers, this._config.i18n);
    }

}

export class MonolythDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends Daemon<S, Modules> {

    cli() {
        const cli = new MonolythCLI(/*this.space, */this.trxEngines);
        return cli.run();
    }

}