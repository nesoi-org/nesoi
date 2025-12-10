import type { Compiler } from '../compiler';

import { Log } from '~/engine/util/log';
import { BucketTypeCompiler } from '../types/bucket.type_compiler';

/**
 * [Compiler Stage #6]
 * Build the node elements (the schemas which are saved to the .nesoi folder),
 * following the graph resolved on previous steps.
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class BuildElementsStage {

    constructor(
        public compiler: Compiler
    ) {}

    public async run() {        
        Log.info('compiler', 'stage.build_elements', 'Building Elements...');
        const t0 = new Date().getTime();
        
        const bucket_types = new BucketTypeCompiler(this.compiler.tree);
        await bucket_types.run();

        await this.compiler.tree.traverse('Building elements ', async node => {
            const module = this.compiler.modules[node.tag.module];
            await module.buildElementNode(node, bucket_types);
        });

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.build_elements', `[t: ${(t-t0)/1000} ms]`);
    }

}