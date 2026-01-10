import type { Compiler } from '../compiler';

import { Log } from '~/engine/util/log';
import { TypeCompiler } from '../types/type_compiler';
import { CompilerError } from '../error';

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
        
        const types = new TypeCompiler(this.compiler.tree);
        try {
            await types.run();
        }
        catch (error: any) {
            console.error(error);
            throw CompilerError.TypeBuildFailed(error);
        }

        await this.compiler.tree.traverse('Building elements ', async node => {
            const module = this.compiler.modules[node.tag.module];

            try {
                const element = await module.buildElementNode(node, types);
                element?.buildInterfaces()
            }
            catch (error: any) {
                console.log(error);
                throw CompilerError.ElementBuildFailed(node.tag.full);
            }
        });

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.build_elements', `[t: ${(t-t0)/1000} ms]`);
    }

}