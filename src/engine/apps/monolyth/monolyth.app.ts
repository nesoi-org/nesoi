import { $Space, ModuleName } from '~/schema';
import { IService } from '../service';
import { InlineApp } from './../inline.app';
import { AnyTrxEngine } from '../../transaction/trx_engine';
import { Space } from '../../space';
import { Daemon } from '~/engine/daemon';
import { Log } from '~/engine/util/log';
import { AppConfigFactory } from '../app.config';

/**
 * @category App
 * @subcategory Monolyth
 */
export class MonolythApp<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>
> extends InlineApp<S, ModuleNames, Services> {

    private watcher?: import('chokidar').FSWatcher;

    constructor(
        name: string,
        space?: Space<S>
    ) {
        super(name, []);
        this.builders = undefined;
        this.space = space;
    }

    protected _packageJson?: Record<string, any>;

    // Override InlineApp abstract methods

    public async daemon($?: {
        watch?: boolean
    }) {
        /**
         * When running from development environment (with Space)
         * this flag watches file changes on the space path and
         * reboots the modules.
         * 
         * Dynamic imports are used here so `chokidar` can be declared
         * as a "devDependency" instead of a "dependency".
         */
        if (this.space && $?.watch) {
            import('chokidar').then(({default: chokidar}) => {
                this.watcher = chokidar.watch(Space.path(this.space!), {
                    ignored: [
                        Space.path(this.space!, 'node_modules'),
                        Space.path(this.space!, '.nesoi'),
                        Space.path(this.space!, 'build')
                    ]
                }); // TODO: change to .
                this.watcher
                    .on('change', () => {
                        this.remake()
                    })
            })
        }

        return super.daemon();
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, services: Record<string, IService>) {
        return new MonolythDaemon(this.name, trxEngines, services, this._config);
    }

    // Reboot (from Watcher)

    public async remake() {
        Log.warn('app', 'monolyth', `File changes detected. Remaking app '${this.name}'`)
        if (!this._daemon) {
            Log.error('app', 'monolyth', `Attempt to remake app ${this.name} failed: Daemon not running.`)
            return;
        }
        await Daemon.destroy(this._daemon);
        this.bootPromise = undefined;
        const app = await this.make();
        await Daemon.reload(this._daemon, app.trxEngines, app.services);
    }

    
    // Type Builder Overrides

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as MonolythApp<S, M & ModuleNames>;
    }

    public service<
        T extends IService
    >($: T) {
        super.service($);
        return this as MonolythApp<S, ModuleNames, Services & {
            [K in T['name']]: T
        }>
    }

    public get config(): AppConfigFactory<S, ModuleNames, Services, typeof this> {
        return new AppConfigFactory(this);
    }

}

/**
 * @category App
 * @subcategory Monolyth
 */
export class MonolythDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends Daemon<S, Modules> {

}