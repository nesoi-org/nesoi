import type { ObjTypeAsObj } from '~/engine/util/type';
import type { $Topic } from '~/elements/blocks/topic/topic.schema';

import { Element } from './element';
import { DumpHelpers } from '../helpers/dump_helpers';

export class TopicElement extends Element<$Topic> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = Element.Never;
        this.schema['#output'] = Element.Any;
    }

    protected buildType() {

        // return t.obj({
        //     public $t: $BlockType = 'block' as any;
        //     public '#authn'!: {};
        //     public '#input'!: $Message;
        //     public '#output'!: unknown;
        
        //     constructor(
        //         public module: string,
        //         public name: string,
        //         public alias: string,
        //         public auth: $BlockAuth[],
        //         public input: Tag[],
        //         public output?: $BlockOutput
        //     ) {}


        //     $t: t.literal('topic'),
        //     dependencies: t.list(t.literal('*Tag')),
        //     module: t.string(),
        //     name: t.string(),
        //     alias: t.string(),
        //     auth: t.$BlockAuth[],
        //     input: t.unknown(), // TODO
        //     output: t.unknown() // TODO
        // })


        const { input } = Element.makeIOType(this.compiler, this.schema);
        const type = DumpHelpers.dumpValueToType(this.schema);

        delete (type as ObjTypeAsObj)['output'];

        return {
            ...(type as any),
            '#authn': Element.makeAuthnType(this.schema.auth),
            '#input': input,
            '#output': input,
        };
    }

}