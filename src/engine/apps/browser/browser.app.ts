import { $Space, ModuleName } from '~/schema';
import { IService } from '../service';
import { InlineApp } from './../inline.app';
import { AnyTrxEngine } from '../../transaction/trx_engine';
import { Space } from '../../space';
import { AppConfigBuilder } from '../app.config';
import { MonolythDaemon } from '../monolyth/monolyth.app';
import { BrowserCompiler } from '~/compiler/apps/browser/browser_compiler';
import { Compiler } from '~/compiler/compiler';
import { MonolythCompilerConfig } from '~/compiler/apps/monolyth/monolyth_compiler';

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

    public static compile(compiler: Compiler, appPath: string,config?: MonolythCompilerConfig) {
        return new BrowserCompiler(compiler, appPath, config)
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