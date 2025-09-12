import { Element } from './element';
import { $Controller } from '~/elements/edge/controller/controller.schema';
import { DumpHelpers } from '../helpers/dump_helpers';
import { NameHelpers } from '~/engine/util/name_helpers';

export class ControllerElement extends Element<$Controller> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = Element.Any;
    }

    protected buildType() {

        const type = DumpHelpers.dumpValueToType(this.schema);

        const input = this.schema.input.map(tag => 
            NameHelpers.tagType(tag, this.module)
        ).join(' | ');
        
        return {
            '#authn': Element.makeAuthnType(this.schema.auth),
            '#input': input,
            ...(type as any)
        };
    }

}