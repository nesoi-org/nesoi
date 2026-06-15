import { $Controller } from '~/elements/edge/controller/controller.schema';

import { Element } from './element';
import { DumpHelpers } from '../helpers/dump_helpers';
import { NameHelpers } from '~/engine/util/name_helpers';

export class ControllerElement extends Element<$Controller> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = Element.Any;
        this.schema['#path'] = Element.Any;
    }

    protected buildType() {

        const type = DumpHelpers.dumpValueToType(this.schema)
        
        const input = this.schema.input.map(tag => 
            NameHelpers.tagType(tag, this.module)
        ).join(' | ');

        const endpoints = $Controller.endpoints(this.schema);
        const path = Object.fromEntries(
            Object.entries(endpoints).map(p => [
                p[0],
                NameHelpers.tagType(p[1].endpoint.msg, this.module)
            ])
        )
        
        return {
            ...(type as any),
            '#authn': Element.makeAuthnType(this.schema.auth),
            '#input': input,
            '#path': path
        };
    }

}