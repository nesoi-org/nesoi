import { $Module, $Space } from '~/schema';
import { Module } from '~/engine/module';
import { $Controller, $ControllerEndpoint, $ControllerTopic } from './controller.schema';
import { ControllerAdapter } from './adapters/controller_adapter';
import { CLIControllerAdapter } from './adapters/cli.controller_adapter';
import { ControllerConfig } from './controller.config';
import { AnyDaemon } from '~/engine/daemon';
import { AuthnRequest } from '~/engine/auth/authn';
import { TrxNode } from '~/engine/transaction/trx_node';
import { AnyMessage } from '~/elements/entities/message/message';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Elements
 * @subcategory Edge
 */
export class ControllerEndpoint<
    $ extends $ControllerEndpoint
> {
    constructor(
        public schema: $,
        public adapter: ControllerAdapter,
        public path: string
    ) {}

    public invoke(data: Record<string, any>, authn?: AuthnRequest<any>) {
        const raw = {
            ...data,
            $: this.schema.msg.name
        };
        if (this.schema.implicit) {
            Object.assign(raw, this.schema.implicit);
        }
        
        return this.adapter.trx(async trx => {
            TrxNode.checkAuthn(trx, this.schema.authn);
            
            if (this.schema.target.type === 'job') {
                return trx.job(this.schema.target.refName).run(raw);
            }
            if (this.schema.target.type === 'resource') {
                return trx.resource(this.schema.target.refName).run(raw as any);
            }
            if (this.schema.target.type === 'machine') {
                return trx.machine(this.schema.target.refName).run(raw as any);
            }
        }, authn);
    }
}

/**
 * @category Elements
 * @subcategory Edge
 */
export class ControllerTopic<
    $ extends $ControllerTopic
> {
    constructor(
        public schema: $,
        public adapter: ControllerAdapter,
        public path: string
    ) {}

    public async subscribe(
        fn: (msg: AnyMessage) => void,
        authn?: AuthnRequest<any>
    ): Promise<string> {
        const response = await this.adapter.trx(trx => {
            TrxNode.checkAuthn(trx, this.schema.authn);
            return trx.topic(this.schema.name).subscribe(fn)
        }, authn);
        if (response.state === 'error') {
            throw NesoiError.Controller.SubscribeFailed({ topic: this.schema.alias })
        }
        return response.output;
    }

    public async unsubscribe(
        id: string
    ): Promise<string> {
        const response = await this.adapter.trx(trx => {
            TrxNode.checkAuthn(trx, this.schema.authn);
            return trx.topic(this.schema.name).unsubscribe(id)
        });
        if (response.state === 'error') {
            throw NesoiError.Controller.UnsubscribeFailed({ topic: this.schema.alias })
        }
        return response.output;
    }
}

export class Controller<
    S extends $Space,
    M extends $Module,
    $ extends $Controller
> {

    public adapter: ControllerAdapter;

    constructor(
        module: Module<S, M>,
        public schema: $,
        public config?: ControllerConfig<M, $, any>,
        public services: Record<string, any> = {}
    ) {
        this.adapter = config?.adapter?.(module.schema, schema, services) || new CLIControllerAdapter(module.schema, schema);
    }
    
    public bind(daemon: AnyDaemon) {
        this.adapter.bind(daemon);
    }

}

export type AnyController = Controller<any,any, any>;