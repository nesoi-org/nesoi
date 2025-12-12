import type { ModuleName } from '~/schema';
import type { BucketConfig } from '~/elements/entities/bucket/bucket.config';
import type { AuthProvider } from '../auth/authn';
import type { ControllerConfig } from '~/elements/edge/controller/controller.config';
import type { TrxEngineConfig } from '../transaction/trx_engine.config';
import type { AnyApp, App } from './app';
import type { IService } from './service';
import type { CLIConfig } from '../cli/cli';
import type { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import type { $TrashBucket } from '../data/trash';
import type { Overlay } from '../util/type';
import type { TrxStatus } from '../transaction/trx';
import type { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';

import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { Tag } from '../dependency';
import { ModuleTree } from '../tree';

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
    env?: $Message
    dotenv?: string
    auth?: AppAuthConfig<S>
    
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

// auth

export type AppAuthConfig<
    S extends $Space
> = { [K in keyof S['users']]?: () => AuthProvider<S['users'][K], any> }

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

    public env (def: MessageTemplateDef<S, any, '__env__'>) {
        const builder = new MessageBuilder('__app__', '__env__')
            .template(def as any);
        const schema = MessageBuilder.build({
            builder,
            dependencies: [],
            filepath: '',
            inlines: {},
            tag: new Tag('__app__', 'message', '__env__'),
        }, new ModuleTree({}), {} as any);
        this.config.env = schema;
        return this.app;
    }
    public dotenv(filename: string = '.env') {
        this.config.dotenv = filename;
        return this.app;
    }

    public auth (config: AppAuthConfig<S>) {
        this.config.auth = config;
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