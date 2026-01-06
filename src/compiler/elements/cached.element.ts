/* @nesoi:browser ignore-start */
import type { ProgressiveBuildCache } from '../progressive';
/* @nesoi:browser ignore-end */
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { Compiler } from '../compiler';

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
            {
                imports: [],
                types: [],
                nodes: []
            }            
        )
    }

    protected prepare() {
    }

    public buildInterfaces() {
        
    }

    public dumpTypeSchema(cache: ProgressiveBuildCache): string {
        return cache.types.elements[this.tag.full];
    }

}