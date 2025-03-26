import { Element, ObjTypeAsObj } from './element';
import { $Queue } from '~/elements/blocks/queue/queue.schema';
import { DumpHelpers } from '../helpers/dump_helpers';

export class QueueElement extends Element<$Queue> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = Element.Any;
        this.schema['#output'] = Element.Any;
    }

    protected buildType() {

        const { input, output } = Element.makeIOType(this.compiler, this.schema);
        const type = DumpHelpers.dumpValueToType(this.schema);

        delete (type as ObjTypeAsObj)['output'];

        return {
            '#authn': Element.makeAuthnType(this.schema.authn),
            '#input': input,
            '#output': output,
            ...(type as any),
        };
    }

}