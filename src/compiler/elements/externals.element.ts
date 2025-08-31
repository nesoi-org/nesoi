import { $Externals } from '~/elements/edge/externals/externals.schema';
import { Element } from './element';
import { Compiler } from '../compiler';
import { ResolvedBuilderNode } from '~/engine/dependency';
import { BucketElement } from './bucket.element';
import { JobElement } from './job.element';
import { DumpHelpers } from '../helpers/dump_helpers';

export class ExternalsElement extends Element<$Externals> {

    private elements = {
        bucket: {} as Record<string, BucketElement>,
        job: {} as Record<string, JobElement>
    }

    constructor(
        protected compiler: Compiler,
        protected module: string,
        public $t: string,
        public files: string[],
        public schema: $Externals,
        public dependencies: ResolvedBuilderNode[],
        public inlineRoot?: ResolvedBuilderNode,
        public bridge?: ResolvedBuilderNode['bridge']
    ) {
        super(compiler, module, $t, files, schema, dependencies, inlineRoot, bridge);
    }

    protected buildType() {
        return {}
    }

    public dumpFileSchema() {
        return `const ${this.typeName} = ${DumpHelpers.dumpSchema(this.schema)}\n`
           + `export default ${this.typeName}`;
    }

    public getModuleDependencies() {
        this.type = this.buildType();
        this.prepare();
        
        const externalModules: Set<string> = new Set();

        Object.values(this.schema.buckets).forEach(ref => {
            externalModules.add(ref.module);
        })
        Object.values(this.schema.messages).forEach(ref => {
            externalModules.add(ref.module);
        })
        Object.values(this.schema.jobs).forEach(ref => {
            externalModules.add(ref.module);
        })

        // Add imports for external elements
        this.compiler.modules[this.module].elements.forEach(el => {
            el.dependencies.forEach(dep => {
                if (dep.tag.module !== this.tag.module) {
                    externalModules.add(dep.tag.module);
                }
            })
        })

        return Array.from(externalModules);
    }

}