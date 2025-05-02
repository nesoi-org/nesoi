import { $Module, $Space } from '~/schema';
import { Module } from '~/engine/module';
import { $Controller, $ControllerEndpoint } from './controller.schema';
import { ControllerAdapter } from './adapters/controller_adapter';
import { CLIControllerAdapter } from './adapters/cli.controller_adapter';
import { ControllerConfig } from './controller.config';
import { AnyDaemon } from '~/engine/daemon';
import { AuthnRequest } from '~/engine/auth/authn';
import { TrxNode } from '~/engine/transaction/trx_node';

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

export class Controller<
    S extends $Space,
    M extends $Module,
    $ extends $Controller
> {

    public adapter: ControllerAdapter;

    constructor(
        module: Module<S, M>,
        public schema: $,
        public config?: ControllerConfig<$, any>,
        public providers: Record<string, any> = {}
    ) {
        this.adapter = config?.adapter?.(schema, providers) || new CLIControllerAdapter(schema);
    }
    
    public bind(daemon: AnyDaemon) {
        this.adapter.bind(daemon);
    }

}

export type AnyController = Controller<any,any, any>;