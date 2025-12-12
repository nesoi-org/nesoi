import type { ModuleName } from '~/schema';
import type { AnyTrxEngine} from '~/engine/transaction/trx_engine';
import type { AnyModule, Module } from '~/engine/module';
import type { Space } from '~/engine/space';
import type { AppConfigBuilder } from '~/engine/app/app.config';
import type { IService } from '~/engine/app/service';
import type { DistributedAppConfig, AnyAppConfig } from './distributed.app.config';

import { TrxEngine } from '~/engine/transaction/trx_engine';
import { ModuleTree } from '~/engine/tree';
import { Log } from '~/engine/util/log';
import _Promise from '~/engine/util/promise';
import { Builder } from '~/engine/builder';
import { App } from '~/engine/app/app';
import { INCServer } from '~/engine/app/inc/inc.server';
import { MonolythDaemon } from '~/engine/app/native/monolyth.app';
import { DistributedAppConfigBuilder } from './distributed.app.config';
import type { AnyAuthnProviders } from '~/engine/auth/authn';

export class DistributedNodeApp<
    S extends $Space,
    Nodes extends Record<string, DistributedNodeApp<any, any, any, any>>,
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
            const module = this._modules[node.tag.module];
            await Builder.buildNode(module, node, tree);
        });
    }
    
    public boot(): DistributedNodeApp<S, Nodes, ModuleNames, Services> {
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
            (service as any).config = (service as any).configFn();
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

        Log.debug('app', this.name, 'Linking app values');
        this.linkAppValues(modules);

        return {
            modules,
            services,
            trxEngines
        }
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
                value.value = process.env[value.key!];
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

    public modules<M extends ModuleName<S>>(modules: M[]): DistributedNodeApp<S, Nodes, M & ModuleNames, Services> {
        super.modules(modules);
        return this as never;
    }

    public service<
        T extends IService
    >($: T) {
        super.service($);
        return this as DistributedNodeApp<S, Nodes, ModuleNames, Services & {
            [K in T['name']]: T
        }>
    }

    public package(_package: Record<string, any>) {
        this.packageJson = _package;
        return this;
    }

    public get config(): AppConfigBuilder<S, ModuleNames, Services> {
        return new DistributedAppConfigBuilder(this) as never;
    }
}

/* Builder */

export type DistributedAppNodeDef<
    S extends $Space,
    Nodes extends Record<string, DistributedNodeApp<any, any, any, any>>,
    ModuleNames extends string,
    Services extends Record<string, any>
> = (builder: DistributedNodeApp<S, Nodes, keyof S['modules'] & string, {}> ) => DistributedNodeApp<S, Nodes, ModuleNames, Services>

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