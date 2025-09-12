import { Element, ObjTypeAsObj } from './element';
import { $Topic } from '~/elements/blocks/topic/topic.schema';
import { DumpHelpers } from '../helpers/dump_helpers';

export class TopicElement extends Element<$Topic> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = Element.Never;
        this.schema['#output'] = Element.Any;
    }

    protected buildType() {

        const { input } = Element.makeIOType(this.compiler, this.schema);
        const type = DumpHelpers.dumpValueToType(this.schema);

        delete (type as ObjTypeAsObj)['output'];

        return {
            '#authn': Element.makeAuthnType(this.schema.auth),
            '#input': input,
            '#output': input,
            ...(type as any),
        };
    }

}