import { Log } from '~/engine/util/log';
import { Compiler } from '../compiler';
import { AnyModule } from '~/engine/module';

/**
 * [Compiler Stage #2]
 * Treeshake each module to finds it's nodes, inline nodes and dependencies,
 * then resolve a graph of such dependencies.
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class TreeshakeStage {

    constructor(
        public compiler: Compiler
    ) {}

    public async run() {        
        Log.info('compiler', 'stage.treeshake', 'Treeshaking Nodes and Resolving Dependencies...');

        const modules: Record<string, AnyModule> = {};
        Object.entries(this.compiler.modules).forEach(([name, module]) => {
            modules[name] = module.module;
        });

        this.compiler.tree.modules = modules;
        await this.compiler.tree.resolve();
    }

}