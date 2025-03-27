import { $Space, ModuleName } from '~/schema';
import { BucketConfig } from '~/elements/entities/bucket/bucket.config';
import { AuthnProvider } from '../auth/authn';
import { ControllerConfig } from '~/elements/edge/controller/controller.config';
import { TrxEngineConfig } from '../transaction/trx_engine.config';
import { CompilerConfig } from '~/compiler/compiler';
import { AnyApp, App } from './app';
import { CLIConfig } from '../cli/cli';

/*
    Configs
*/

export type AppConfig<
    S extends $Space,
    Modules extends ModuleName<S>
> = {
    i18n?: AppI18nConfig
    authn?: AppAuthnConfig<S>
    buckets?: AppBucketConfig<S, Modules, any>
    controllers?: AppControllerConfig<S, Modules, any>
    cli?: CLIConfig<any>,
    compiler?: CompilerConfig
    trxEngine?: AppTrxEngineConfig<S, Modules, any>
}
export type AnyAppConfig = AppConfig<any, any>

export type AppI18nConfig = {
    [x: string]: ($: Record<string, any>) => string
}

export type AppAuthnConfig<
    S extends $Space
> = { [K in keyof S['authnUsers']]: AuthnProvider<S['authnUsers'][K]> }

export type AppBucketConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Providers extends Record<string, any>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: Partial<{
        [K in keyof S['modules'][M]['buckets']]: BucketConfig<S['modules'][M]['buckets'][K], Providers>
    }>
}>
export type AppControllerConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Providers extends Record<string, any>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: Partial<{
        [K in keyof S['modules'][M]['controllers']]: ControllerConfig<S['modules'][M]['controllers'][K], Providers>
    }>
}>
export type AppTrxEngineConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Providers extends Record<string, any>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: TrxEngineConfig<S, S['modules'][M], any, Providers>
}>

export class AppConfigFactory<
    S extends $Space,
    Modules extends string = ModuleName<S> & string,
    Providers extends Record<string, any> = Record<string, any>
> {
    private config: AppConfig<any, any>

    constructor(
        private app: App<S, Modules, Providers>
    ) {
        this.config = (app as any)._config as AnyApp['_config'];
    }

    public i18n (config: AppI18nConfig) {
        this.config.i18n = config;
        return this.app;
    }
    public authn (config: AppAuthnConfig<S>) {
        this.config.authn = config;
        return this.app;
    }
    public buckets (config: AppBucketConfig<S, Modules, Providers>) {
        this.config.buckets = config as never;
        return this.app;
    }
    public controllers (config: AppControllerConfig<S, Modules, Providers>) {
        this.config.controllers = config as never;
        return this.app;
    }
    public compiler (config: CompilerConfig) {
        this.config.compiler = config;
        return this.app;
    }
    public cli (config: CLIConfig<Providers>) {
        this.config.cli = config;
        return this.app;
    }
    public trx (config: AppTrxEngineConfig<S, Modules, Providers>) {
        this.config.trxEngine = config;
        return this.app;
    }
}