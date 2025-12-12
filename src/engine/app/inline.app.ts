import type { ModuleName } from '~/schema';
import type { AnyService, IService } from './service';
import type { AnyTrxEngine} from '../transaction/trx_engine';
import type { AnyBuilder, AnyModule, Module } from '../module';
import type { AnyDaemon} from '../daemon';

import { App } from './app';
import { Log } from '../util/log';
import { TrxEngine } from '../transaction/trx_engine';
import { ModuleTree } from '../tree';
import { Daemon } from '../daemon';
import { AppConfigBuilder } from './app.config';
import _Promise from '../util/promise';
import { Tag } from '../dependency';
import { Builder } from '../builder';
import { MessageTemplateFieldParser } from '~/elements/entities/message/template/message_template_parser';
import { TrxNode } from '../transaction/trx_node';
import { DotEnv } from '../util/dotenv';

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
            const module = this._modules[node.tag.module];
            await Builder.buildNode(module, node, tree);
        });
    }

    /**
     * Build the application, start services and trx engines.
     * Returns references to start a daemon.
     */
    protected async make(dotenv?: string) {
        if (this.space || this.builders) {
            await this.boot().bootPromise
        }
        
        const modules = this._modules;
        for (const key in this._injectedModules) {
            const mod = this._injectedModules[key];
            modules[mod.name] = mod
        }

        dotenv = dotenv || this._config.dotenv;
        if (dotenv) {
            Log.debug('app', this.name, `Loading environment variables from ${dotenv}`);
            DotEnv.load(dotenv);
        }

        if (this._config.env) {
            Log.debug('app', this.name, 'Validating environment variables');
            await this.validateEnv();
        }

        Log.debug('app', this.name, 'Linking app values');
        this.linkAppValues(modules);
        
        Log.debug('app', this.name, 'Starting services');
        const services: Record<string, AnyService> = {};
        for (const key in this._services) {
            const service = this._services[key];
            (service as any).config = (service as any).configFn();
            await _Promise.solve(
                service.up({
                    modules
                })
            );
            services[key] = service as AnyService
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

        return {
            modules,
            services,
            trxEngines
        }
    }

    public async daemon($?: { dotenv?: string }) {
        if (this._daemon) {
            return this._daemon
        }

        const app = await this.make($?.dotenv);

        Log.debug('app', this.name, 'Spawning daemon');
        this._daemon = this.makeDaemon(app.trxEngines, app.services);

        // Link daemon to modules
        for (const m in app.modules) {
            const module = app.modules[m];
            module.daemon = this._daemon;
        }

        Log.debug('app', this.name, 'Initializing services');
        for (const key in app.services) {
            await _Promise.solve(
                app.services[key].onDaemonReady({
                    daemon: this._daemon
                })
            );
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
     * This method validates the environment using the app env validator.
     */
    protected async validateEnv() {
        const env = process.env;
        const trxNode = new TrxNode('root', {} as any, undefined, { name: '__app__' } as any);
        try {
            const parsed = await MessageTemplateFieldParser(trxNode, this._config.env!.template.fields, env);
            Object.assign(process.env, parsed);
        }
        catch (e: any) {
            Log.error('app', this.name, 'Environment variables missing or incorrect.', e);
            throw new Error('Environment variables missing or incorrect.');
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
                /* @nesoi:browser ignore-start */
                value.value = process.env[value.key!];
                /* @nesoi:browser ignore-end */
                /* @nesoi:browser add
                value.value = localStorage.getItem(value.key)
                */
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
> extends Daemon<S, Modules> {

    protected async getSchema(tag: Tag): Promise<AnyElementSchema> {
        const trxEngine = this.trxEngines[tag.module as keyof typeof this.trxEngines];
        const _module = trxEngine.getModule();
        const schema = Tag.resolveFrom(tag, _module.schema);
        return Promise.resolve(schema);
    }

}