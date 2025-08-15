import { Log } from '~/engine/util/log';
import { Compiler } from '../compiler';
import { AnyModule } from '~/engine/module';

/* @nesoi:browser ignore-start */
import { ProgressiveBuild } from '../progressive';
/* @nesoi:browser ignore-end */

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
        const t0 = new Date().getTime();

        const modules: Record<string, AnyModule> = {};
        Object.entries(this.compiler.modules).forEach(([name, module]) => {
            modules[name] = module.module;
        });

        this.compiler.tree.modules = modules;

        /* @nesoi:browser ignore-start */
        const cache = await ProgressiveBuild.cache(this.compiler)
        await this.compiler.tree.resolve(cache);

        await ProgressiveBuild.save(this.compiler.space, cache);
        /* @nesoi:browser ignore-end */
        
        const t = new Date().getTime();
        Log.debug('compiler', 'stage.treeshake', `[t: ${(t-t0)/1000} ms]`);
    }

}