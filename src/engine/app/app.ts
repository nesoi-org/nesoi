import type { AnyBuilder, AnyModule} from '../module';
import type { Daemon } from '../daemon';
import type { AnyAppConfig} from './app.config';
import type { IService } from './service';

import { Module } from '../module';
import { Space } from '../space';
import { AppConfigBuilder } from './app.config';
import type { ModuleName } from '~/schema';
import type { $Space } from 'index';

/*
    App
*/

/**
 * @category App
 */
export abstract class App<
    S extends $Space,
    Modules extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>
> {

    protected _config: AnyAppConfig = {};
    protected _nesoiNpmPkg = 'nesoi';

    // This is a list of names to be read from the space.
    // If the app is not booted with a space, this does nothing.
    protected _spaceModuleNames: ModuleName<S>[] = [];

    // A list of modules injected into the application prior to
    // running the daemon. These will be included on the daemon
    // once it's run.
    protected _injectedModules: AnyModule[] = [];

    // A list of services, which are created and destroyed
    // along with the daemon. These are internally available for
    // blocks - usually used by adapters.
    protected _services: Record<string, IService> = {};

    // If the app is being booted from a space (live or compiling)
    // this is defined.
    protected space?: Space<S>

    // If the app is being booted from a list of builders,
    // this is defined.
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

    /**
     * Scan the space for modules and their elements,
     * then build all schemas.
     * This can be run without await before the daemon,
     * to preload the module in background.
     */
    public abstract boot(): App<S, Modules, Services>

    /**
     * Spawn a daemon for this app.
     */
    public abstract daemon($?: { dotenv?: string }): Promise<Daemon<S, Modules>>

    //

    /**
     * Specifies which `Space` modules to include on this App.
     * 
     * ⚠ This has no effect on apps without a `Space`, such as `InlineApp`.
     * @param modules A list of names of modules from the current `Space`.
     */
    protected modules<M extends ModuleName<S>>(modules: M[]) {
        this._spaceModuleNames = modules as never;
        return this as App<S, M & Modules, Services>;
    }

    /**
     * Injects pre-built modules into this App.
     * These will be included on the Daemon once it starts.
     * 
     * @param modules A list of pre-built modules.
     */
    protected inject(modules: AnyModule[]) {
        this._injectedModules = modules;
        return this;
    }

    /**
     * Declares a `Service`.
     * 
     * Services are started and ended along with the daemon, and can be used on the App
     * config to share globals between adapters and other methods.
     * @param $ object with an `up` and `down` method to create/destroy the service
     */
    protected service<
        T extends IService
    >($: T) {
        this._services[$.name] = $;
        return this as App<S, Modules, Services & {
            [K in T['name']]: T
        }>
    }    

    //

    protected get config(): AppConfigBuilder<S, Modules, Services> {
        return new AppConfigBuilder(this);
    }

    // 

    protected makeModules() {
        const modules = {} as Record<string, AnyModule>;
        if (this.space) {
            Space.scan(this.space, (name, path, subdir) => {
                if (this._spaceModuleNames.includes(name)) {
                    modules[name] = new Module(name, { dirpath: path }, subdir);
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

    //

    public static getServices(app: AnyApp) {
        return app._services;
    }

    public static getInfo(app: AnyApp) {
        return {
            spaceModules: app._spaceModuleNames,
            config: app._config,
            nesoiNpmPkg: app._nesoiNpmPkg,
        }
    }
}

export type AnyApp = App<any, any>