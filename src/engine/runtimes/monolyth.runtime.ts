import { $Space, ModuleName } from '~/schema';
import { Daemon, RuntimeAuthnConfig, RuntimeBucketConfig, RuntimeControllerConfig, RuntimeI18nConfig, RuntimeTrxEngineConfig } from './runtime';
import { LibraryRuntime } from './library.runtime';
import { MonolythCLI } from './monolyth.cli';
import { AnyTrxEngine } from '../transaction/trx_engine';
import { Space } from '../space';
import { MonolythCompilerConfig } from '~/compiler/runtimes/monolyth/monolyth_compiler';
import { AnyModule } from '../module';

export class MonolythRuntime<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> extends LibraryRuntime<S, ModuleNames, Providers> {

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
        return this as MonolythRuntime<S, M & ModuleNames>;
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
        return this as MonolythRuntime<S, ModuleNames, Providers & {
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

    protected configI18n(i18n: RuntimeI18nConfig) {
        super.configI18n(i18n);
        return this as MonolythRuntime<S, ModuleNames, Providers>;
    }

    protected configAuthn(authn: RuntimeAuthnConfig<S>) {
        super.configAuthn(authn);
        return this as MonolythRuntime<S, ModuleNames, Providers>;
    }

    protected configBuckets(buckets: RuntimeBucketConfig<S, ModuleNames, Providers>) {
        super.configBuckets(buckets);
        return this as MonolythRuntime<S, ModuleNames, Providers>;
    }

    protected configControllers(controllers: RuntimeControllerConfig<S, ModuleNames, Providers>) {
        super.configControllers(controllers);
        return this as MonolythRuntime<S, ModuleNames, Providers>;
    }

    protected configCompiler(compiler: MonolythCompilerConfig) {
        this._config.compiler = compiler;
        return this as MonolythRuntime<S, ModuleNames, Providers>;
    }

    protected configTrx(trxEngine: RuntimeTrxEngineConfig<S, ModuleNames, Providers>) {
        super.configTrx(trxEngine as any);
        return this as MonolythRuntime<S, ModuleNames, Providers>;
    }

    public boot(): MonolythRuntime<S, ModuleNames, Providers> {
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