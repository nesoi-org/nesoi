import { $Module, $Space, ModuleName } from '~/schema';
import { App, AppProvider } from './app';
import { Log } from '../util/log';
import { AnyTrxEngine, TrxEngine } from '../transaction/trx_engine';
import { ModuleTree } from '../tree';
import { AnyBuilder, AnyModule, Module } from '../module';
import { AnyDaemon, Daemon } from '../daemon';
import { AnyAuthnProviders } from '../auth/authn';
import { AppConfigFactory } from './app.config';

/**
 * @category App
 */
export class InlineApp<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> extends App<S, ModuleNames, Providers> {

    protected _daemon?: Daemon<S, ModuleNames>;
    protected _modules: Record<string, AnyModule> = {};

    private packageJson?: Record<string, any>;
    protected bootPromise?: Promise<void>;

    constructor(
        name: string,
        builders: AnyBuilder[]
    ) {
        super(name, { builders });
    }


    // App abstract methods

    public boot(): InlineApp<S, ModuleNames, Providers> {
        if (!this.bootPromise) {
            this.bootPromise = this.build();
        }
        return this;
    }


    // Inline

    /**
     * Treeshake and build modules declared for this application.
     */
    protected async build() {
        Log.info('app', this.name, 'Booting');
        this._modules = await this.makeModules();
        
        Log.debug('app', this.name, 'Building');
        const tree = new ModuleTree(this._modules, {
            exclude: ['*.test.ts']
        });

        await tree.resolve();        
        await tree.traverse('Building', async node => {
            // Inline nodes are built by their root builder
            if (node.isInline) { return; }
            const module = this._modules[node.module];
            await module.buildNode(node, tree);
        });
    }

    /**
     * Build the application, start providers and trx engines.
     * Returns references to start a daemon.
     */
    protected async make() {
        if (this.space || this.builders) {
            await this.boot().bootPromise
        }
        
        const modules = this._modules;
        for (const key in this._injectedModules) {
            const mod = this._injectedModules[key];
            modules[mod.name] = mod
        }

        const providers: Record<string, any> = {};
        for (const key in this._providers) {
            const provider = this._providers[key].up({
                modules
            })
            provider.__down = this._providers[key].down
            providers[key] = provider
        }

        Log.debug('app', this.name, 'Starting transaction engines');
        const trxEngines: Record<ModuleNames, AnyTrxEngine> = {} as any;
        for (const m in modules) {
            const module = modules[m];
            module.start(this as any, providers);
            const trxConfig = this._config.trxEngine?.[m]

            const authn: AnyAuthnProviders = {};
            for (const a in this._config?.authn || {}) {
                const prov = this._config.authn?.[a]?.();
                if (prov) {
                    authn[a] = prov;
                }
            }
            
            trxEngines[m as ModuleNames] = new TrxEngine(`app:${this.name}`, module, authn, trxConfig, providers);
        }

        Log.debug('app', this.name, 'Linking externals');
        this.linkExternals(modules);

        return {
            modules,
            providers,
            trxEngines
        }
    }

    public async daemon() {
        if (this._daemon) {
            return this._daemon
        }

        const app = await this.make();

        Log.debug('app', this.name, 'Spawning daemon');
        this._daemon = this.makeDaemon(app.trxEngines, app.providers);

        // Link daemon to modules
        for (const m in app.modules) {
            const module = app.modules[m];
            module.daemon = this._daemon;
        }

        return this._daemon;
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, providers: Record<string, any>): AnyDaemon {
        return new InlineDaemon(this.name, trxEngines, providers, this._config);
    }

    public package(_package: Record<string, any>) {
        this.packageJson = _package;
        return this;
    }

    /**
     * This method injects elements flagged as externals by referencing them
     * from the other module directly, given this is a single-threaded App.
     * 
     * TODO: allow overriding this behavior with adapters
     */
    protected linkExternals(modules: Record<string, Module<S, $Module>>) {
        Object.values(modules).forEach(module => {
            const buckets = module.schema.externals.buckets;
            Object.values(buckets).forEach(bucket => {
                module.buckets[bucket.refName] = modules[bucket.module].buckets[bucket.name];
                module.nql.linkExternal(modules[bucket.module].buckets[bucket.name]);
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
    
    // Type Builder Overrides

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as InlineApp<S, M & ModuleNames>;
    }

    public provider<
        Name extends string,
        T
    >($: AppProvider<Name, T>) {
        super.provider($);
        return this as InlineApp<S, ModuleNames, Providers & {
            [K in Name]: T
        }>
    }

    public get config(): AppConfigFactory<S, ModuleNames, Providers, typeof this> {
        return new AppConfigFactory(this);
    }

    //

    public static package(app: InlineApp<any, any>, scripts: Record<string, string>, dependencies: Record<string, string>) {
        return {
            'name': app.name,
            'version': '1.0.0',
            'description': '',
            'main': 'index.js',
            scripts,
            dependencies,
            ...(app.packageJson || {})
        }  
    }

}

export class InlineDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends Daemon<S, Modules> {}