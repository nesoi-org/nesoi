import type { AnyDaemon } from '~/engine/daemon';

import { Log } from '~/engine/util/log';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { AuthRequest } from '~/engine/auth/authn';
import type { ControllerEndpoint, ControllerTopic } from '../controller';
import { $Controller } from '../controller.schema';
import { NesoiError } from '~/engine/data/error';

export type ControllerEndpointPath = ($ControllerDomain | $ControllerGroup | $ControllerEndpoint)[]


/**
 * @category Adapters
 * @subcategory Edge
 */
export abstract class ControllerAdapter {

    protected daemon?: AnyDaemon;
    protected endpoints: {
        [path_str: string]: {
            path: ControllerEndpointPath,
            endpoint: ControllerEndpoint<$ControllerEndpoint>
        }
    } = {}
    protected topics: {
        [path: string]: ControllerTopic<$ControllerTopic>
    } = {}

    constructor(
        protected module: $Module,
        protected schema: $Controller
    ) {}

    async trx(
        fn: (trx: AnyTrxNode) => Promise<any>,
        endpoint: { name: string, idempotent?: boolean },
        auth?: AuthRequest<any>,
    ) {
        if (!this.daemon) {
            throw new Error('Controller not bound to a daemon');
        }
        try {
            const trx = this.daemon.trx(this.schema.module)
                .origin(`controller:${this.schema.name}:${endpoint.name}`)
                .auth(auth);
            
            return await trx.run(fn, {
                idempotent: endpoint.idempotent
            });
        }
        catch (e: any) {
            Log.error('controller', this.schema.name, 'Unknown error', e)
            throw e;
        }
    }

    public bind(
        daemon: AnyDaemon
    ): void {
        this.daemon = daemon;
        const endpoints = $Controller.endpoints(this.schema);
        for (const key in endpoints) {
            const { endpoint, path } = endpoints[key];
            const path_str = this.makePath(path, endpoint);
            this.endpoints[key] = {
                path,
                endpoint: this.makeEndpoint(path_str, endpoint)
            }
        }
        for (const t in this.schema.topics) {
            const topic = this.schema.topics[t];
            this.topics[t] = this.makeTopic(topic);
        }
    }

    public invoke(path: string, data: Record<string, any>, auth?: AuthRequest<any>) {
        const e = this.endpoints[path];
        if (!e) {
            throw NesoiError.Controller.EndpointNotFound({ endpoint: path, controller: this.schema.alias })
        }        
        return e.endpoint.invoke(data, auth);
    }

    protected makePath(path: ControllerEndpointPath, endpoint: $ControllerEndpoint) {
        return $Controller.makePath(this.schema, path, endpoint);
    }
    protected abstract makeEndpoint(path: string, schema: $ControllerEndpoint): ControllerEndpoint<$ControllerEndpoint>;
    protected abstract makeTopic(schema: $ControllerTopic): ControllerTopic<$ControllerTopic>;

}