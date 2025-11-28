/* @nesoi:browser ignore-start */
import type { ProgressiveBuildCache } from '../progressive';
/* @nesoi:browser ignore-end */
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { Compiler } from '../compiler';
import type { AnyElementSchema } from '~/engine/module';

import { Element } from './element';

export class CachedElement extends Element<AnyElementSchema> {

    constructor(
        compiler: Compiler,
        node: ResolvedBuilderNode
    ) {
        super(
            compiler,
            node.tag.module,
            node.tag.type,
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
        return cache.types.elements[this.tag.full];
    }

}