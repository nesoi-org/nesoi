import { $Space, ModuleName } from '~/schema';
import { AnyBuilder, AnyModule, Module } from '../module';
import { Space } from '../space';
import { Daemon } from '../daemon';
import { AnyAppConfig, AppConfigFactory } from './app.config';

/**
 * Provider
 */

export type AppProvider<out Name, T> = {
    name: Name
    up: ($: { modules: Record<string, AnyModule> }) => T
    down: (provider: NoInfer<T>) => any
    libPaths?: string[]
}
export type AnyAppProvider = AppProvider<any, any>

/*
    App
*/

export abstract class App<
    S extends $Space,
    Modules extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> {

    protected _config: AnyAppConfig = {};

    // This is a list of names to be read from the space.
    // If the app is not booted with a space, this does nothing.
    protected _spaceModuleNames: ModuleName<S>[] = [];

    // A list of modules injected into the application prior to
    // running the daemon. These will be included on the daemon
    // once it's run.
    protected _injectedModules: AnyModule[] = [];

    // A list of providers, which are created and destroyed
    // along with the daemon. These are internally available for
    // blocks - usually used by adapters.
    protected _providers: Record<string, AnyAppProvider> = {};

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
    public abstract boot(): App<S, Modules, Providers>

    /**
     * Spawn a daemon for this app.
     */
    public abstract daemon(): Promise<Daemon<S, Modules>>

    //

    /**
     * Specifies which `Space` modules to include on this App.
     * 
     * ⚠ This has no effect on apps without a `Space`, such as `InlineApp`.
     * @param modules A list of names of modules from the current `Space`.
     */
    public modules<M extends ModuleName<S>>(modules: M[]) {
        this._spaceModuleNames = modules as never;
        return this as App<S, M & Modules, Providers>;
    }

    /**
     * Injects pre-built modules into this App.
     * These will be included on the Daemon once it starts.
     * 
     * @param modules A list of pre-built modules.
     */
    public inject(modules: AnyModule[]) {
        this._injectedModules = modules;
        return this;
    }

    /**
     * Declares a `Provider` with a given name.
     * 
     * Providers are started and ended along with the daemon, and can be used on the App
     * config to share globals between adapters and other methods.
     * @param $ `AppProvider` with an `up` and `down` method to create/destroy the provider.
     */
    public provider<
        Name extends string,
        T
    >($: AppProvider<Name, T>) {
        this._providers[$.name] = $;
        return this as App<S, Modules, Providers & {
            [K in Name]: T
        }>
    }

    //

    public get config(): AppConfigFactory<S, Modules, Providers> {
        return new AppConfigFactory(this);
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

    //

    public static getProviders(app: AnyApp) {
        return app._providers;
    }

    public static getInfo(app: AnyApp) {
        return {
            spaceModules: app._spaceModuleNames,
            config: app._config
        }
    }
}

export type AnyApp = App<any, any>