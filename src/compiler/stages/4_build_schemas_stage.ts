import { Log } from '~/engine/util/log';
import { Compiler } from '../compiler';

/**
 * [Compiler Stage #4]
 * Build the node schemas, following the graph resolved on previous steps.
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class BuildSchemasStage {

    constructor(
        public compiler: Compiler
    ) {}

    public async run() {        
        Log.info('compiler', 'stage.build_schemas', 'Building schemas...');

        await this.compiler.tree.traverse('Building schemas ', async node => {
            
            // Inline nodes are built by their root builder
            if (node.isInline) { return; }

            const module = this.compiler.modules[node.module].module;
            await module.buildNode(node, this.compiler.tree);
        });
    }

}