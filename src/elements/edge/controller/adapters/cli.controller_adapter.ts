import { ControllerAdapter } from './controller_adapter';
import { ControllerEndpoint, ControllerTopic } from '../controller';
import { $ControllerDomain, $ControllerEndpoint, $ControllerGroup, $ControllerTopic } from '../controller.schema';
import { Log } from '~/engine/util/log';

export type ControllerEndpointPath = ($ControllerDomain | $ControllerGroup | $ControllerEndpoint)[]

/**
 * @category Adapters
 * @subcategory Edge
 */
export class CLIControllerAdapter extends ControllerAdapter {
    
    public endpoints: Record<string, ControllerEndpoint<$ControllerEndpoint>> = {};
    public topics: Record<string, ControllerTopic<$ControllerTopic>> = {};

    protected makeEndpoint(path: string, schema: $ControllerEndpoint) {
        this.endpoints[path] = new ControllerEndpoint(schema, this, path);
        Log.debug('controller', this.schema.name, `Bound endpoint '${path}' to '${schema.target}'`);
    }

    protected makeTopic(schema: $ControllerTopic) {
        this.topics[schema.name] = new ControllerTopic(schema, this, schema.name);
        Log.debug('controller', this.schema.name, `Bound topic '${schema.name}'`);
    }
}