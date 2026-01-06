import type { ModuleName } from '~/schema';
import type { IService } from '~/engine/app/service';
import type { Space } from '~/engine/space';
import type { AnyTrxEngine } from '~/engine/transaction/trx_engine';

import { MonolythDaemon } from './monolyth.app';
import { AppConfigBuilder } from '~/engine/app/app.config';
import { InlineApp } from '~/engine/app/inline.app';

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

    // Override InlineApp abstract methods

    public async daemon($?: {
        watch?: boolean,
        dotenv?: string
    }) {
        return super.daemon($);
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