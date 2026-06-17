import { ControllerAdapter } from './controller_adapter';
import { ControllerEndpoint, ControllerTopic } from '../controller';
import { Log } from '~/engine/util/log';

/**
 * @category Adapters
 * @subcategory Edge
 */
export class CLIControllerAdapter extends ControllerAdapter {
    
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
}