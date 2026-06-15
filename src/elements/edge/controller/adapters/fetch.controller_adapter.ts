import type { $Controller, $ControllerDomain, $ControllerEndpoint, $ControllerTopic, ControllerEndpointPath} from '../controller.schema';

import { ControllerAdapter } from './controller_adapter';
import { ControllerEndpoint, ControllerTopic } from '../controller';
import { Log } from '~/engine/util/log';
import type { $Module } from '~/elements';
import { NesoiError } from '~/engine/data/error';
import type { AuthRequest } from '~/engine/auth/authn';
import { TrxStatus } from '~/engine/transaction/trx';
import { NesoiDatetime } from '~/engine/data/datetime';

/**
 * @category Adapters
 * @subcategory Edge
 */
export class FetchControllerAdapter extends ControllerAdapter {
    
    constructor(
        module: $Module,
        schema: $Controller,
        protected config: {
            base_url: string
        }
    ) {
        super(module, schema);
    }

    protected makeEndpoint(path: string, schema: $ControllerEndpoint) {
        const endpoint = new ControllerEndpoint(schema, this, path);
        Log.debug('controller', this.schema.name, `Bound endpoint '${path}' to '${schema.target}'`);
        return endpoint;
    }

    protected makeTopic(schema: $ControllerTopic) {
        const topic = new ControllerTopic(schema, this, schema.name);
        Log.debug('controller', this.schema.name, `Bound topic '${schema.name}'`);
        return topic;
    }

    public async invoke(path: string, data: Record<string, any>, auth?: AuthRequest<any>) {
        const endpoint = this.endpoints[path];
        if (!endpoint) {
            throw NesoiError.Controller.EndpointNotFound({ endpoint: path, controller: this.schema.alias })
        }        
        const start = NesoiDatetime.now();
        const url = this.config.base_url + this.makeApiPath(endpoint);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(async response => ({
                    status: response.status,
                    headers: response.headers,
                    body: await response.json().catch(() => null)
                }))
                .then((response) => {
                    // if (response.status === 401) {
                    //     // ...
                    // }
                    return response.body as { data: Record<string, any> | Record<string, any>[] }
                })
                .catch((e) => {
                    Log.error('controller', 'fetch', e.toString(), e);
                    // ...
                    throw e
                })
            const end = NesoiDatetime.now();
            return new TrxStatus('#','plugin:fetch', start, end, 'ok', response);
        }
        catch (e: any) {
            const end = NesoiDatetime.now();
            const error = new NesoiError.BaseError('FetchError', e.toString(), 401, e);
            return new TrxStatus('#','plugin:fetch', start, end, 'error', undefined, error);
        }
    }

    protected makeApiPath(endpoint: {
        path: ControllerEndpointPath
        endpoint: ControllerEndpoint<any>
    }) {
        const domain = endpoint.path[0] as $ControllerDomain;
        const root = domain.name
            ? [this.schema.name, domain.version, domain.name]
            : [this.schema.name, domain.version];

        const list = [
            ...root,
            ...endpoint.path.slice(1).map(node => node.name),
            endpoint.endpoint.schema.name.startsWith('#') ? '' : endpoint.endpoint.schema.name
        ];
        return '/' + list.join('/');
    }
}