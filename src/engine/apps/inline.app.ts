import { $Module, $Space, ModuleName } from '~/schema';
import { App } from './app';
import { IService } from './service';
import { Log } from '../util/log';
import { AnyTrxEngine, TrxEngine } from '../transaction/trx_engine';
import { ModuleTree } from '../tree';
import { AnyBuilder, AnyModule, Module } from '../module';
import { AnyDaemon, Daemon } from '../daemon';
import { AnyAuthnProviders } from '../auth/authn';
import { AppConfigBuilder } from './app.config';
import _Promise from '../util/promise';

/**
 * @category App
 */
export class InlineApp<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>
> extends App<S, ModuleNames, Services> {

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

    public boot(): InlineApp<S, ModuleNames, Services> {
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
     * Build the application, start services and trx engines.
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

        const services: Record<string, any> = {};
        for (const key in this._services) {
            const service = this._services[key];
            await _Promise.solve(
                service.up({
                    modules
                })
            );
            services[key] = service
        }

        Log.debug('app', this.name, 'Starting transaction engines');
        const trxEngines: Record<ModuleNames, AnyTrxEngine> = {} as any;
        for (const m in modules) {
            const module = modules[m];
            module.start(this as any, services);
            const trxConfig = this._config.modules?.[m]?.trx

            const authn: AnyAuthnProviders = {};
            for (const a in this._config?.authn || {}) {
                const prov = this._config.authn?.[a]?.();
                if (prov) {
                    authn[a] = prov;
                }
            }
            
            trxEngines[m as ModuleNames] = new TrxEngine(`app:${this.name}`, module, authn, trxConfig, services);
        }

        Log.debug('app', this.name, 'Linking externals');
        this.linkExternals(modules);

        Log.debug('app', this.name, 'Linking app values');
        this.linkAppValues(modules);

        return {
            modules,
            services,
            trxEngines
        }
    }

    public async daemon() {
        if (this._daemon) {
            return this._daemon
        }

        const app = await this.make();

        Log.debug('app', this.name, 'Spawning daemon');
        this._daemon = this.makeDaemon(app.trxEngines, app.services);

        // Link daemon to modules
        for (const m in app.modules) {
            const module = app.modules[m];
            module.daemon = this._daemon;
        }

        return this._daemon;
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, services: Record<string, IService>): AnyDaemon {
        return new InlineDaemon(this.name, trxEngines, services, this._config);
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
            module.injectDependencies(modules, {
                buckets: Object.values(module.schema.externals.buckets),
                messages: Object.values(module.schema.externals.messages),
                jobs: Object.values(module.schema.externals.jobs),
                machines: Object.values(module.schema.externals.machines),
            })
            const buckets = module.schema.externals.buckets;
            Object.values(buckets).forEach(bucket => {
                module.nql.linkExternal(modules[bucket.module].buckets[bucket.name]);
            })
        })
    }

    /**
     * This method injects values from environment variables into each module's
     * app constants.
     */
    protected linkAppValues(modules: Record<string, Module<S, $Module>>) {
        Object.values(modules).forEach(module => {
            const values = module.schema.constants.values;
            Object.values(values).forEach(value => {
                if (value.scope !== 'app') return;
                value.value = process.env[value.key];
            })
        })
    }
    
    // Type Builder Overrides

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as InlineApp<S, M & ModuleNames>;
    }

    public service<
        T extends IService
    >($: T) {
        super.service($);
        return this as InlineApp<S, ModuleNames, Services & {
            [K in T['name']]: T
        }>
    }

    public get config(): AppConfigBuilder<S, ModuleNames, Services, typeof this> {
        return new AppConfigBuilder(this);
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