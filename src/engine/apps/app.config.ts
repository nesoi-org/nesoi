import { $Space, ModuleName } from '~/schema';
import { BucketConfig } from '~/elements/entities/bucket/bucket.config';
import { AuthnProvider } from '../auth/authn';
import { ControllerConfig } from '~/elements/edge/controller/controller.config';
import { TrxEngineConfig } from '../transaction/trx_engine.config';
import { CompilerConfig } from '~/compiler/compiler';
import { AnyApp, App } from './app';
import { IService } from './service';
import { CLIConfig } from '../cli/cli';
import { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { $TrashBucket } from '../data/trash';
import { $Bucket } from '~/elements';
import { Overlay } from '../util/type';
import { TrxStatus } from '../transaction/trx';
import { NesoiObj } from '../data/obj';

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
    trash?: AppTrashConfig<S, Modules, any>
}
export type AnyAppConfig = AppConfig<any, any>

// i18n

export type AppI18nConfig = {
    [x: string]: ($: Record<string, any>) => string
}

// authn

export type AppAuthnConfig<
    S extends $Space
> = { [K in keyof S['authnUsers']]: () => AuthnProvider<S['authnUsers'][K]> }

// bucket

export type AppBucketConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Services extends Record<string, IService>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: Partial<{
        [K in keyof S['modules'][M]['buckets']]: BucketConfig<S['modules'][M], S['modules'][M]['buckets'][K], Services>
    }>
}>

// trash

export type AppTrashConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Services extends Record<string, IService>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: {
        adapter?: (schema: typeof $TrashBucket, services: Services) => BucketAdapter<typeof $TrashBucket['#data']>,
    }
}>

// controller

export type AppControllerConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Services extends Record<string, IService>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: Partial<{
        [K in keyof S['modules'][M]['controllers']]: ControllerConfig<S['modules'][M], S['modules'][M]['controllers'][K], Services>
    }>
}>

// trx

export type AppTrxEngineConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Services extends Record<string, IService>
> = Partial<{
    [M in (Modules & keyof S['modules'])]: TrxEngineConfig<S, S['modules'][M], any, Services>
}>

// audit

export type AppAuditConfig = {
    adapter: ($: Overlay<$Bucket, { '#data': NesoiObj }>) => BucketAdapter<NesoiObj>,
    transform?: (trx: TrxStatus<any>) => Record<string, any>
}

/**
 * Factory
 */

/**
 * @category App
 */
export class AppConfigFactory<
    S extends $Space,
    Modules extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>,
    _App = App<S, Modules, Services>
> {
    private config: AppConfig<any, any>

    constructor(
        private app: _App
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
    public buckets (config: AppBucketConfig<S, Modules, Services>) {
        this.config.buckets = config as never;
        return this.app;
    }
    public trash (config: AppTrashConfig<S, Modules, Services>) {
        this.config.trash = config as never;
        return this.app;
    }
    public controllers (config: AppControllerConfig<S, Modules, Services>) {
        this.config.controllers = config as never;
        return this.app;
    }
    public audit (config: AppI18nConfig) {
        this.config.i18n = config;
        return this.app;
    }
    public compiler (config: CompilerConfig) {
        this.config.compiler = config;
        return this.app;
    }
    public cli (config: CLIConfig<Services>) {
        this.config.cli = config;
        return this.app;
    }
    public trx (config: AppTrxEngineConfig<S, Modules, Services>) {
        this.config.trxEngine = config;
        return this.app;
    }
}