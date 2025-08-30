import { Log } from '~/engine/util/log';
import { Compiler } from '../compiler';
import {  $Externals } from '~/elements';
import { CompilerError } from '../error';
import { Builder } from '~/engine/builder';

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
        const t0 = new Date().getTime();

        await this.compiler.tree.traverse('Building schemas ', async node => {
            const module = this.compiler.modules[node.tag.module].module;

            if (node.progressive) {
                await module.inject({
                    [node.progressive.schema.$t+'s']: [node.progressive.schema]
                });
                return;
            }

            // Accummulate imports from depencies
            // (Given that dependencies are built in order)
            node.bridge ??= { imports: [] };
            node.bridge.imports ??= [];
            for (const dep of node.dependencies) {
                // If a dependency is inline and the node is it's root,
                // they already share imports.
                if (dep.node.root == node) continue;
                node.bridge.imports.push(...(dep.node.bridge?.imports || []));
            }

            // Inline nodes are built by their root builder
            if (node.isInline) { return; }

            await Builder.buildNode(module, node, this.compiler.tree);

            // Inject external enums on the module schema
            if (node.type === 'externals') {
                const schema = node.schema as $Externals;
                for (const e in schema.enums) {
                    const enumDep = schema.enums[e];
                    const enumModule = this.compiler.modules[enumDep.module].module;
                    const constants = enumModule.schema.constants;
                    if (!constants.enums[enumDep.name]) {
                        throw CompilerError.ExternalEnumNotFound(e);
                    }
                    module.schema.constants.enums[enumDep.refName] = constants.enums[enumDep.name];
                }
                for (const e in schema.values) {
                    const valueDep = schema.values[e];
                    const valueModule = this.compiler.modules[valueDep.module].module;
                    const constants = valueModule.schema.constants;
                    if (!constants.values[valueDep.name]) {
                        throw CompilerError.ExternalValueNotFound(e);
                    }
                    module.schema.constants.values[valueDep.refName] = constants.values[valueDep.name];
                }
            }

        });

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.build_schemas', `[t: ${(t-t0)/1000} ms]`);
    }

}