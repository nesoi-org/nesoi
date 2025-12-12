import type { AnyDaemon } from '~/engine/daemon';

import { Log } from '~/engine/util/log';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { AuthRequest } from '~/engine/auth/authn';

export type ControllerEndpointPath = ($ControllerDomain | $ControllerGroup | $ControllerEndpoint)[]


/**
 * @category Adapters
 * @subcategory Edge
 */
export abstract class ControllerAdapter {

    protected daemon?: AnyDaemon;

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
                .origin('controller:'+this.schema.name+':'+endpoint.name)
                .auth(auth);
            
            return await trx.run(fn, undefined, endpoint.idempotent);
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
        for (const d in this.schema.domains) {
            const domain = this.schema.domains[d];
            this.makeGroup(domain, [domain]);
        }
        for (const t in this.schema.topics) {
            const topic = this.schema.topics[t];
            this.makeTopic(topic);
        }
    }

    protected abstract makeEndpoint(path: string, schema: $ControllerEndpoint): void;
    protected abstract makeTopic(schema: $ControllerTopic): void;
    
    protected makeGroup(group: $ControllerGroup, root: ControllerEndpointPath = []) {
        for (const e in group.endpoints) {
            const endpoint = group.endpoints[e];
            const path = this.makePath(this.schema, [...root, endpoint]);
            this.makeEndpoint(path, endpoint);
        }
        for (const e in group.groups) {
            const childGroup = group.groups[e];
            const childRoot = [...root, childGroup];
            this.makeGroup( childGroup, childRoot);
        }
    }

    protected makePath(schema: $Controller, path: ControllerEndpointPath) {
        const domain = path[0] as $ControllerDomain;
        const root = domain.name
            ? [schema.name, domain.name, domain.version]
            : [schema.name, domain.version];
        const list = root.concat(path
            .slice(1)
            .map(node => node.name)
        );
        return '/' + list.join('/');
    }

}