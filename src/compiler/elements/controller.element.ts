import { $Dependency } from '~/engine/dependency';
import { Element } from './element';
import { $Controller } from '~/elements/edge/controller/controller.schema';
import { DumpHelpers } from '../helpers/dump_helpers';

export class ControllerElement extends Element<$Controller> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = Element.Any;
    }

    protected buildType() {

        const type = DumpHelpers.dumpValueToType(this.schema);

        const input = this.schema.input.map(dep => 
            $Dependency.typeName(dep, this.module)
        ).join(' | ');
        
        return {
            '#authn': Element.makeAuthnType(this.schema.authn),
            '#input': input,
            ...(type as any)
        };
    }

}