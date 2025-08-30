import { Compiler } from '../compiler';
import { Log } from '~/engine/util/log';

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
        
        await this.compiler.tree.traverse('Building elements ', async node => {
            const module = this.compiler.modules[node.tag.module];
            await module.buildElementNode(node);
        });

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.build_elements', `[t: ${(t-t0)/1000} ms]`);
    }

}