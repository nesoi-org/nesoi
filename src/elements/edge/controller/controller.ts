import type { $Module, $Space } from '~/schema';
import type { Module } from '~/engine/module';
import type { $Controller, $ControllerEndpoint, $ControllerTopic } from './controller.schema';
import type { ControllerAdapter } from './adapters/controller_adapter';
import type { ControllerConfig } from './controller.config';
import type { AnyDaemon } from '~/engine/daemon';
import type { AuthRequest } from '~/engine/auth/authn';
import type { AnyMessage } from '~/elements/entities/message/message';

import { TrxNode } from '~/engine/transaction/trx_node';
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

    public invoke(data: Record<string, any>, auth?: AuthRequest<any>) {
        const raw = {
            ...data,
            $: this.schema.msg.name
        };
        if (this.schema.implicit) {
            Object.assign(raw, this.schema.implicit);
        }
        
        return this.adapter.trx(async trx => {
            await TrxNode.checkAuth(trx, this.schema.auth);
            
            if (this.schema.target.type === 'job') {
                return trx.job(this.schema.target.short).run(raw);
            }
            if (this.schema.target.type === 'resource') {
                return trx.resource(this.schema.target.short).run(raw as any);
            }
            if (this.schema.target.type === 'machine') {
                return trx.machine(this.schema.target.short).run(raw as any);
            }
        }, this.schema, auth);
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
        auth?: AuthRequest<any>
    ): Promise<string> {
        const response = await this.adapter.trx(async trx => {
            await TrxNode.checkAuth(trx, this.schema.auth);
            return trx.topic(this.schema.name).subscribe(fn)
        }, this.schema, auth);
        if (response.state === 'error') {
            throw NesoiError.Controller.SubscribeFailed({ topic: this.schema.alias })
        }
        return response.output;
    }

    public async unsubscribe(
        id: string
    ): Promise<string> {
        const response = await this.adapter.trx(async trx => {
            await TrxNode.checkAuth(trx, this.schema.auth);
            return trx.topic(this.schema.name).unsubscribe(id)
        }, this.schema);
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
        public services: Record<string, any> = {},
        defaultAdapter?: ControllerAdapter
    ) {
        this.adapter = config?.adapter?.(module.schema, schema, services) || defaultAdapter!;
    }
    
    public bind(daemon: AnyDaemon) {
        this.adapter.bind(daemon);
    }

}

export type AnyController = Controller<any,any, any>;