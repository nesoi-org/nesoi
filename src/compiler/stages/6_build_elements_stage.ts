import { Compiler } from '../compiler';
import { Log } from '~/engine/util/log';

/**
 * [Compiler Stage #6]
 * Build the node elements (the schemas which are saved to the .nesoi folder),
 * following the graph resolved on previous steps.
 */
export class BuildElementsStage {

    constructor(
        public compiler: Compiler
    ) {}

    public async run() {        
        Log.info('compiler', 'stage.build_elements', 'Building Elements...');

        await this.compiler.tree.traverse('Building elements ', async node => {
            const module = this.compiler.modules[node.module];
            await module.buildElementNode(node);
        });
    }

}