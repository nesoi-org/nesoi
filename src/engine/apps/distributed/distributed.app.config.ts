import { $Space, ModuleName } from '~/schema';
import { CompilerConfig } from '~/compiler/compiler';
import { AppAuthnConfig, AppI18nConfig, AppConfig, AppControllerConfig, AppTrashConfig } from '../app.config';
import { CLIConfig } from '~/engine/cli/cli';
import { IService } from '../service';
import { DistributedAppNode } from './distributed_node.app';
import { TrxEngineConfig } from '~/engine/transaction/trx_engine.config';
import { BucketConfig } from '~/elements/entities/bucket/bucket.config';

/*
    Configs
*/

export type DistributedAppModuleConfig<
    S extends $Space,
    M extends ModuleName<S>,
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>,
    Services extends Record<string, IService>,
> = {
    buckets?: DistributedAppBucketConfig<S, M, Nodes, Services>
    jobs?: DistributedAppJobConfig<S, M, Nodes>
    trash?: AppTrashConfig<Services>
    controllers?: AppControllerConfig<S, M, Services>
    trx?: TrxEngineConfig<S, S['modules'][M], any, Services>
}

export type DistributedAppConfig<
    S extends $Space,
    Modules extends ModuleName<S>,
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>,
    Services extends Record<string, IService>,
> = {
    authn?: AppAuthnConfig<S>

    modules?: Partial<{
        [M in (Modules & keyof S['modules'])]: DistributedAppModuleConfig<S, M, Nodes, Services>
    }>

    i18n?: AppI18nConfig
    cli?: CLIConfig<any>,
    compiler?: CompilerConfig
}
export type AnyAppConfig = AppConfig<any, any, any>

// bucket

export type DistributedAppBucketConfig<
    S extends $Space,
    M extends keyof S['modules'],
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>,
    Services extends Record<string, IService>,
> = Partial<{
    [K in keyof S['modules'][M]['buckets']]: keyof Nodes | BucketConfig<S['modules'][M], S['modules'][M]['buckets'][K], Services>
}>

// job

export type DistributedAppJobConfig<
    S extends $Space,
    M extends keyof S['modules'],
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>
> = Partial<{
    [K in keyof S['modules'][M]['jobs']]: keyof Nodes
}>

/**
 * @category DistributedApp
 */
export class DistributedAppConfigBuilder<
    S extends $Space,
    Nodes extends Record<string, DistributedAppNode<any, any, any, any>>,
    Modules extends string = ModuleName<S> & string,
    Services extends Record<string, any> = Record<string, any>
> {

    constructor(
        private node: DistributedAppNode<S, Nodes, Modules, Services>
    ) {
    }

    public authn (config: AppAuthnConfig<S>) {
        // TODO
        return this.node;
    }
    public module<M extends Modules> (name: M, config: DistributedAppModuleConfig<S, M, Nodes, Services>) {
        // TODO
        return this.node;
    }
    public audit (config: AppI18nConfig) {
        // TODO
        return this.node;
    }
    public i18n (config: AppI18nConfig) {
        // TODO
        return this.node;
    }
    public cli (config: CLIConfig<Services>) {
        // TODO
        return this.node;
    }
    public compiler (config: CompilerConfig) {
        // TODO
        return this.node;
    }

}