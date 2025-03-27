import { $Space, ModuleName } from '~/schema';
import { AppProvider } from '../app';
import { InlineApp } from './../inline.app';
import { AnyTrxEngine } from '../../transaction/trx_engine';
import { Space } from '../../space';
import { Daemon } from '~/engine/daemon';
import { Log } from '~/engine/util/log';

export class MonolythApp<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> extends InlineApp<S, ModuleNames, Providers> {

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

    // Type Builder Overrides

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as MonolythApp<S, M & ModuleNames>;
    }

    public provider<
        Name extends string,
        T
    >($: AppProvider<Name, T>) {
        super.provider($);
        return this as MonolythApp<S, ModuleNames, Providers & {
            [K in Name]: T
        }>
    }

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
                this.watcher = chokidar.watch(Space.path(this.space!, '..', '..')); // TODO: change to .
                this.watcher
                    .on('change', () => {
                        this.remake()
                    })
            })
        }

        return super.daemon();
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, providers: Record<string, any>) {
        return new MonolythDaemon(this.name, trxEngines, providers, this._config);
    }

    // Reboot (from Watcher)

    public async remake() {
        Log.warn('app', 'monolyth', `File changes detected. Remaking app '${this.name}'`)
        if (!this._daemon) {
            Log.error('app', 'monolyth', `Attempt to remake app ${this.name} failed: Daemon not running.`)
            return;
        }
        const app = await this.make();
        await Daemon.reload(this._daemon, app.trxEngines, app.providers);
    }

}

export class MonolythDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends Daemon<S, Modules> {

    // cli() {
    //     const cli = new MonolythCLI(/*this.space, */this.trxEngines);
    //     return cli.run();
    // }

}