import { $Externals } from '~/elements/edge/externals/externals.schema';
import { Element } from './element';
import { Compiler } from '../compiler';
import { ResolvedBuilderNode } from '~/engine/dependency';
import { BucketElement } from './bucket.element';
import { JobElement } from './job.element';
import { NameHelpers } from '../helpers/name_helpers';
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
        
        // Object.entries(schema.buckets).forEach(([key, ref]) => {
        //     const element = compiler.modules[ref.module].elements
        //         .find(el => el.lowName === ref.name && el.$t === 'bucket')
        //     if (!element) {
        //         throw new Error(`External bucket ${ref.name} not found`)
        //     }
        //     this.elements.bucket[key] = element as BucketElement;
        // })

        // Object.entries(schema.jobs).forEach(([key, ref]) => {
        //     const element = compiler.modules[ref.module].elements
        //         .find(el => el.lowName === ref.name && el.$t === 'job')
        //     if (!element) {
        //         throw new Error(`External job ${ref.name} not found`)
        //     }
        //     this.elements.job[key] = element as JobElement;
        // })

        // this.type = this.buildType();
    }

    protected buildType() {
        return {}
        // if (!this.elements) {
        //     return {};
        // }
        // const type = {
        //     models: {},
        //     buckets: {},
        //     jobs: {}
        // } as ObjTypeAsObj;
        
        // Object.entries(this.elements.bucket).map(([tag, el]) => {
        //     type.models[tag] = (el.type as ObjTypeAsObj).model;
        //     type.buckets[tag] = (el.type as ObjTypeAsObj).bucket;
        // })        
        // return type;
    }

    public dumpFileSchema() {
        return `const ${this.typeName} = ${DumpHelpers.dumpSchema(this.schema)}\n`
           + `export default ${this.typeName}`;
    }

    public dumpTypeSchema() {
        this.type = this.buildType();
        this.prepare();
        
        const externalModules: Set<string> = new Set();

        Object.values(this.schema.buckets).forEach(ref => {
            externalModules.add(ref.module);
        })
        Object.values(this.schema.jobs).forEach(ref => {
            externalModules.add(ref.module);
        })

        // Add imports for external elements
        this.compiler.modules[this.module].elements.forEach(el => {
            el.dependencies.forEach(dep => {
                if (dep.module !== this.module) {
                    externalModules.add(dep.module);
                }
            })
        })

        return Array.from(externalModules)
            .map(module => 
                `import ${NameHelpers.nameLowToHigh(module)}Module from './${module}.module'`
            )
            .join('\n');
    }

}