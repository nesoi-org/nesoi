import { $Space, ModuleName } from '~/schema';
import { MonolythDaemon } from '../monolyth/monolyth.app';
import { BrowserBundler } from '~/bundler/browser/browser.bundler';
import { Compiler } from '~/compiler/compiler';
import { MonolythBundlerConfig } from '~/bundler/monolyth/monolyth.bundler';
import { AppConfigBuilder } from '~/engine/app/app.config';
import { InlineApp } from '~/engine/app/inline.app';
import { IService } from '~/engine/app/service';
import { Space } from '~/engine/space';
import { AnyTrxEngine } from '~/engine/transaction/trx_engine';

/**
 * @category App
 * @subcategory Browser
 */
export class BrowserApp<
    S extends $Space,
    ModuleNames extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>
> extends InlineApp<S, ModuleNames, Services> {

    protected _nesoiNpmPkg = '@nesoi/for-browser'

    constructor(
        name: string,
        space?: Space<S>
    ) {
        super(name, []);
        this.builders = undefined;
        this.space = space;
    }

    protected _packageJson?: Record<string, any>;

    //

    public static compile(compiler: Compiler, appPath: string,config?: MonolythBundlerConfig) {
        return new BrowserBundler(compiler, appPath, config)
            .run();
    }

    // Override InlineApp abstract methods

    public async daemon($?: {
        watch?: boolean
    }) {
        return super.daemon();
    }

    protected makeDaemon(trxEngines: Record<ModuleNames, AnyTrxEngine>, services: Record<string, IService>) {
        return new BrowserDaemon(this.name, trxEngines, services, this._config);
    }
    
    // Type Builder Overrides

    public modules<M extends ModuleName<S>>(modules: M[]) {
        super.modules(modules);
        return this as BrowserApp<S, M & ModuleNames>;
    }

    public service<
        T extends IService
    >($: T) {
        super.service($);
        return this as BrowserApp<S, ModuleNames, Services & {
            [K in T['name']]: T
        }>
    }

    public get config(): AppConfigBuilder<S, ModuleNames, Services, typeof this> {
        return new AppConfigBuilder(this);
    }

}

/**
 * @category App
 * @subcategory Browser
 */
export class BrowserDaemon<
    S extends $Space,
    Modules extends ModuleName<S>
> extends MonolythDaemon<S, Modules> {
    
}