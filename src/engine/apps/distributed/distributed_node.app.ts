import { $Module, $Space, ModuleName } from '~/schema';
import { IService } from '../service';
import { AnyAppConfig, DistributedAppConfig, DistributedAppConfigBuilder } from './distributed.app.config';
import { App } from '../app';
import { MonolythDaemon } from '../monolyth/monolyth.app';
import { INCServer } from './inc/inc.server';
import { AnyTrxEngine, TrxEngine } from '~/engine/transaction/trx_engine';
import { AnyModule, Module } from '~/engine/module';
import { AnyAuthnProviders } from '~/engine/auth/authn';
import { ModuleTree } from '~/engine/tree';
import { Log } from '~/engine/util/log';
import _Promise from '~/engine/util/promise';
import { AnyJob } from '~/elements/blocks/job/job';
import { DistributedJob } from './elements/distributed_job';
import { Space } from '~/engine/space';

export class DistributedAppNode<
    S extends $Space,
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>,
    ModuleNames extends string,
    Services extends Record<string, any>,
> extends App<S, ModuleNames, Services> {

    public _host!: {
        host: string,
        port: number
    }

    protected _daemon?: DistributedNodeDaemon<S, ModuleNames>;
    protected _modules: Record<string, AnyModule> = {};

    protected packageJson?: Record<string, any>;
    protected bootPromise?: Promise<void>;
    
    constructor(
        name: string,
        space?: Space<S>
    ) {
        super(name, { builders: [] });
        this.space = space;
    }

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
    
    public boot(): DistributedAppNode<S, Nodes, ModuleNames, Services> {
        if (!this.bootPromise) {
            this.bootPromise = this.build();
        }
        return this;
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

            const authnProviders: AnyAuthnProviders = {};
            for (const a in this._config?.auth || {}) {
                const prov = this._config.auth?.[a]?.();
                if (prov) {
                    authnProviders[a] = prov;
                }
            }
            
            trxEngines[m as ModuleNames] = new TrxEngine(`app:${this.name}`, module, authnProviders, trxConfig, services);
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

    /**
     * This method injects elements flagged as externals by referencing them
     * from the other module directly, given this is a single-threaded App.
     * 
     * TODO: allow overriding this behavior with adapters
     */
    protected linkExternals(modules: Record<string, Module<S, $Module>>) {
        
        Object.values(modules).forEach(module => {
            const jobs: Record<string, AnyJob> = {};

            for (const name in module.schema.externals.jobs) {
                const dep = module.schema.externals.jobs[name];
                const config = this._config as DistributedAppConfig<any, any, any, any>;
                const node = config?.modules?.[dep.module]?.jobs?.[dep.name];
                if (!node) {
                    throw new Error(`External job '${dep.tag}' not configured on module '${this.name}'`)
                }
                jobs[name] = new DistributedJob(module, node as string);
            }

            module.injectRunners({
                // buckets: Object.values(module.schema.externals.buckets),
                // messages: Object.values(module.schema.externals.messages),
                jobs
                // machines: Object.values(module.schema.externals.machines),
            })
            // const buckets = module.schema.externals.buckets;
            // Object.values(buckets).forEach(bucket => {
            //     module.nql.linkExternal(modules[bucket.module].buckets[bucket.name]);
            // })
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

    // Override App abstract methods
    public async daemon() {
        if (this._daemon) {
            return this._daemon
        }

        const app = await this.make();

        Log.debug('app', this.name, 'Spawning daemon');
        this._daemon = new DistributedNodeDaemon<S, ModuleNames>(this.name, this._host, app.trxEngines, app.services, this._config);
        await this._daemon.boot();

        // Link daemon to modules
        for (const m in app.modules) {
            const module = app.modules[m];
            module.daemon = this._daemon;
        }

        return this._daemon;
    }

    public host(config: {
        host: string,
        port: number
    }) {
        this._host = config;
        return this;
    }

    public modules<M extends ModuleName<S>>(modules: M[]): DistributedAppNode<S, Nodes, M & ModuleNames, Services> {
        super.modules(modules);
        return this as never;
    }

    public service<
        T extends IService
    >($: T) {
        super.service($);
        return this as DistributedAppNode<S, Nodes, ModuleNames, Services & {
            [K in T['name']]: T
        }>
    }

    public package(_package: Record<string, any>) {
        this.packageJson = _package;
        return this;
    }

    public get config(): DistributedAppConfigBuilder<S, Nodes, ModuleNames, Services> {
        return new DistributedAppConfigBuilder(this);
    }
}

/* Builder */

export type DistributedAppNodeDef<
    S extends $Space,
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>,
    ModuleNames extends string,
    Services extends Record<string, any>
> = (builder: DistributedAppNode<S, Nodes, keyof S['modules'] & string, {}> ) => DistributedAppNode<S, Nodes, ModuleNames, Services>

/**
 * @category App
 * @subcategory Distributed
 */
export class DistributedNodeDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends MonolythDaemon<S, Modules> {

    private inc: INCServer;

    constructor(
        name: string,
        host: {
            host: string,
            port: number
        },
        trxEngines: Record<Modules, AnyTrxEngine>,
        services: Record<string, IService>,
        config?: DistributedAppConfig<any, any, any, any> | undefined
    ) {
        super(name, trxEngines, services, config as AnyAppConfig)
        this.inc = new INCServer({
            name,
            ...host 
        })
    }

    public async boot() {
        await this.inc.start();
    }
}