import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { $Controller, $ControllerDomain, $ControllerEndpoint, $ControllerGroup } from '../controller.schema';
import { AnyDaemon } from '~/engine/daemon';
import { AuthnRequest } from '~/engine/auth/authn';
import { Log } from '~/engine/util/log';

export type ControllerEndpointPath = ($ControllerDomain | $ControllerGroup | $ControllerEndpoint)[]


export abstract class ControllerAdapter {

    protected daemon?: AnyDaemon;

    constructor(
        protected schema: $Controller
    ) {}

    async trx(
        fn: (trx: AnyTrxNode) => Promise<any>,
        authn?: AuthnRequest<any>
    ) {
        if (!this.daemon) {
            throw new Error('Controller not bound to a daemon');
        }
        try {
            return await this.daemon.trx(this.schema.module)
                .authn(authn)
                .run(fn);
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
    }

    protected abstract makeEndpoint(path: string, schema: $ControllerEndpoint): void;
    
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