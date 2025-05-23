import { ResolvedBuilderNode } from '~/engine/dependency';
import { Compiler } from '../compiler';
import { Element } from './element';
import { AnyElementSchema } from '~/engine/module';
import { ProgressiveBuildCache } from '../progressive';

export class CachedElement extends Element<AnyElementSchema> {

    constructor(
        compiler: Compiler,
        node: ResolvedBuilderNode
    ) {
        super(
            compiler,
            node.module,
            node.type,
            [node.filepath as string],
            node.progressive!.schema,
            [],
            undefined,
            {}            
        )
    }

    protected prepare() {
    }

    protected buildType() {
        return '';
    }

    public dumpTypeSchema(cache: ProgressiveBuildCache): string {
        return cache.types.elements[this.tag];
    }

}