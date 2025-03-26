import { $Module, $Space, ModuleName } from '~/schema';
import { AnyDaemon, Daemon, Runtime, RuntimeAuthnConfig, RuntimeBucketConfig, RuntimeControllerConfig, RuntimeI18nConfig, RuntimeTrxEngineConfig } from './runtime';
import { Log } from '../util/log';
import { AnyTrxEngine, TrxEngine } from '../transaction/trx_engine';
import { ModuleTree } from '../tree';
import { AnyBuilder, AnyModule, Module } from '../module';

export class LibraryRuntime<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> extends Runtime<S, ModuleNames, Providers> {

    protected _daemon?: Daemon<S, ModuleNames>;
    protected _modules: Record<string, AnyModule> = {};

    private packageJson?: Record<string, any>;
    private bootPromise?: Promise<void>;

    constructor(
        name: string,
        builders: AnyBuilder[]
    ) {
        super(name, { builders });
    }

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as LibraryRuntime<S, M & ModuleNames>;
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
        return this as LibraryRuntime<S, ModuleNames, Providers & {
            [K in Name]: T
        }>
    }

    // config (override so that return this works properly)

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
        return this as LibraryRuntime<S, ModuleNames, Providers>;
    }

    protected configAuthn(authn: RuntimeAuthnConfig<S>) {
        super.configAuthn(authn);
        return this as LibraryRuntime<S, ModuleNames, Providers>;
    }

    protected configBuckets(buckets: RuntimeBucketConfig<S, ModuleNames, Providers>) {
        super.configBuckets(buckets);
        return this as LibraryRuntime<S, ModuleNames, Providers>;
    }

    protected configControllers(controllers: RuntimeControllerConfig<S, ModuleNames, Providers>) {
        super.configControllers(controllers);
        return this as LibraryRuntime<S, ModuleNames, Providers>;
    }

    protected configTrx(trxEngine: RuntimeTrxEngineConfig<S, ModuleNames, Providers>) {
        super.configTrx(trxEngine as any);
        return this as LibraryRuntime<S, ModuleNames, Providers>;
    }

    //

    public boot(): LibraryRuntime<S, ModuleNames, Providers> {
        if (!this.bootPromise) {
            this.bootPromise = this.bootFn();
        }
        return this;
    }

    protected async bootFn() {
        Log.info('runtime', this.name, 'Booting');
        this._modules = await this.makeModules();
        
        Log.debug('runtime', this.name, 'Building');
        const tree = new ModuleTree(this._modules, {
            exclude: ['*.test.ts']
        });

        // Gambiarra to disable huge treeshaking/building longs. A better solution is required.
        const _log = console.log;
        console.log = () => {};
        // End of Gambiarra
        
        await tree.resolve();        
        await tree.traverse('Building', async node => {
            // Inline nodes are built by the root builder
            if (node.isInline) { return; }
            const module = this._modules[node.module];
            await module.buildNode(node, tree);
        });

        // Gambiarra to disable huge treeshaking/building longs. A better solution is required.
        console.log = _log;
        // End of Gambiarra
    }

    public async daemon() {
        
        if (this._daemon) {
            return this._daemon
        }

        if (this.space || this.builders) {
            await this.boot().bootPromise
        }
        
        const modules = this._modules;

        this._injectedModules.forEach(module => {
            modules[module.name] = module;
        })

        const providers: Record<string, any> = {};
        for (const key in this._providers) {
            providers[key] = this._providers[key].up({
                modules
            })
        }

        Log.debug('runtime', this.name, 'Starting transaction engines');
        const trxEngines: Record<ModuleNames, AnyTrxEngine> = {} as any;
        for (const m in modules) {
            const module = modules[m];
            module.start(this as any, providers);
            const trxConfig = this._config.trxEngine?.[m]
            trxEngines[m as ModuleNames] = new TrxEngine(`runtime:${this.name}`, module, this._config.authn, trxConfig, providers);
        }

        this.injectExternals(modules);
        
        Log.debug('runtime', this.name, 'Spawning daemon');
        this._daemon = this.makeDaemon(trxEngines, providers);

        // Link daemon to modules
        for (const m in modules) {
            const module = modules[m];
            module.daemon = this._daemon;
        }

        return this._daemon;
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, providers: Record<string, any>): AnyDaemon {
        return new LibraryDaemon(/*this.space,*/ this.name, trxEngines, providers);
    }

    public package(_package: Record<string, any>) {
        this.packageJson = _package;
        return this;
    }

    public static package(runtime: LibraryRuntime<any, any>, scripts: Record<string, string>, dependencies: Record<string, string>) {
        return {
            'name': runtime.name,
            'version': '1.0.0',
            'description': '',
            'main': 'index.js',
            scripts,
            dependencies,
            ...(runtime.packageJson || {})
        }  
    }


    /**
     * This method allows modules to directly call external nodes, from other
     * modules, given this runtime is a Monolyth.
     */
    protected injectExternals(modules: Record<string, Module<S, $Module>>) {
        Object.values(modules).forEach(module => {
            const buckets = module.schema.externals.buckets;
            Object.values(buckets).forEach(bucket => {
                module.buckets[bucket.refName] = modules[bucket.module].buckets[bucket.name];
            })
            const jobs = module.schema.externals.jobs;
            Object.values(jobs).forEach(job => {
                module.jobs[job.refName] = modules[job.module].jobs[job.name];
            })
            const machines = module.schema.externals.machines;
            Object.values(machines).forEach(machine => {
                module.machines[machine.refName] = modules[machine.module].machines[machine.name];
            })
        })
    }
}

export class LibraryDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends Daemon<S, Modules> {

}