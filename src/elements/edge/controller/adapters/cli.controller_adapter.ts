import { ControllerAdapter } from './controller_adapter';
import { ControllerEndpoint } from '../controller';
import { $ControllerDomain, $ControllerEndpoint, $ControllerGroup } from '../controller.schema';
import { Log } from '~/engine/util/log';

export type ControllerEndpointPath = ($ControllerDomain | $ControllerGroup | $ControllerEndpoint)[]

/**
 * @category Adapters
 * @subcategory Edge
 */
export class CLIControllerAdapter extends ControllerAdapter {
    
    public endpoints: Record<string, ControllerEndpoint<$ControllerEndpoint>> = {};

    protected makeEndpoint(path: string, schema: $ControllerEndpoint) {
        this.endpoints[path] = new ControllerEndpoint(schema, this, path);
        Log.debug('controller', this.schema.name, `Bound endpoint '${path}' to '${schema.target.tag}'`);
    }
}