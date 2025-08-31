import { $Space, ModuleName } from '~/schema';
import { BucketConfig } from '~/elements/entities/bucket/bucket.config';
import { AuthnProvider } from '../auth/authn';
import { ControllerConfig } from '~/elements/edge/controller/controller.config';
import { TrxEngineConfig } from '../transaction/trx_engine.config';
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

export type AppModuleConfig<
    S extends $Space,
    M extends ModuleName<S>,
    Services extends Record<string, IService>
> = {
    buckets?: AppBucketConfig<S, M, Services>
    trash?: AppTrashConfig<Services>
    controllers?: AppControllerConfig<S, M, Services>
    trx?: TrxEngineConfig<S, S['modules'][M], any, Services>
}

export type AppConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Services extends Record<string, IService>
> = {
    authn?: AppAuthnConfig<S>
    
    modules?: Partial<{
        [M in (Modules & keyof S['modules'])]: AppModuleConfig<S, M, Services>
    }>

    i18n?: AppI18nConfig
    cli?: CLIConfig<any>,
    compiler?: CompilerConfig
}
export type AnyAppConfig = AppConfig<any, any, any>

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
    M extends keyof S['modules'],
    Services extends Record<string, IService>
> = Partial<{
    [K in keyof S['modules'][M]['buckets']]: BucketConfig<S['modules'][M], S['modules'][M]['buckets'][K], Services>
}>

// trash

export type AppTrashConfig<
    Services extends Record<string, IService>
> = {
    adapter?: (schema: typeof $TrashBucket, services: Services) => BucketAdapter<typeof $TrashBucket['#data']>,
}

// controller

export type AppControllerConfig<
    S extends $Space,
    M extends keyof S['modules'],
    Services extends Record<string, IService>
> = Partial<{
    [K in keyof S['modules'][M]['controllers']]: ControllerConfig<S['modules'][M], S['modules'][M]['controllers'][K], Services>
}>

// trx

export type AppTrxEngineConfig<
    S extends $Space,
    M extends keyof S['modules'],
    Services extends Record<string, IService>
> = TrxEngineConfig<S, S['modules'][M], any, Services>

// audit

export type AppAuditConfig = {
    adapter: ($: Overlay<$Bucket, { '#data': NesoiObj }>) => BucketAdapter<NesoiObj>,
    transform?: (trx: TrxStatus<any>) => Record<string, any>
}

// compiler

export type CompilerConfig = {
    nesoiPath?: string
    nesoiVersion?: string
    exclude?: string[]
    reset?: boolean
    diagnose?: boolean
}

/**
 * Factory
 */

/**
 * @category App
 */
export class AppConfigBuilder<
    S extends $Space,
    Modules extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>,
    _App = App<S, Modules, Services>
> {
    private config: AnyAppConfig

    constructor(
        private app: _App
    ) {
        this.config = (app as any)._config as AnyApp['_config'];
    }

    public authn (config: AppAuthnConfig<S>) {
        this.config.authn = config;
        return this.app;
    }
    public module<M extends Modules> (name: M, config: AppModuleConfig<S, M, Services>) {
        this.config.modules ??= {};
        this.config.modules[name] = config;
        return this.app;
    }
    public audit (config: AppI18nConfig) {
        this.config.i18n = config;
        return this.app;
    }
    public i18n (config: AppI18nConfig) {
        this.config.i18n = config;
        return this.app;
    }
    public cli (config: CLIConfig<Services>) {
        this.config.cli = config;
        return this.app;
    }
    public compiler (config: CompilerConfig) {
        this.config.compiler = config;
        return this.app;
    }
}