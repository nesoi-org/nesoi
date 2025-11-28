import type { ResolvedBuilderNode, TagType } from '~/engine/dependency';
import type { AnyElementSchema } from '~/engine/module';
import type { $Machine, $MachineState, $MachineTransition } from '~/elements/blocks/machine/machine.schema';
import type { $Job } from '~/elements/blocks/job/job.schema';
import type { $Queue } from '~/elements/blocks/queue/queue.schema';
import type { Compiler } from '../compiler';
import type { $Block, $BlockAuth } from '~/elements/blocks/block.schema';
import type { $Message, $Topic } from '~/elements';

import { Tag } from '~/engine/dependency';
import { NameHelpers } from '~/engine/util/name_helpers';
import { DumpHelpers } from '../helpers/dump_helpers';

/* @nesoi:browser ignore-start */
import type { ProgressiveBuildCache } from '../progressive';
import type { TypeAsObj, ObjTypeAsObj } from '~/engine/util/type';
/* @nesoi:browser ignore-end */
export abstract class Element<T extends AnyElementSchema> {

    public static Any = Symbol('undefined as any') as any;
    public static Never = Symbol('undefined as never') as any;

    public type!: TypeAsObj;
    
    public tag: Tag;
    public lowName: string;
    public highName: string;
    public typeName: string;
    
    constructor(
        protected compiler: Compiler,
        protected module: string,
        public $t: string,
        public files: string[],
        public schema: T,
        public dependencies: ResolvedBuilderNode[],
        public inlineRoot?: ResolvedBuilderNode,
        public bridge?: ResolvedBuilderNode['bridge']
    ) {
        const names = NameHelpers.names(schema);
        this.tag = new Tag(module, $t as TagType, names.low);
        this.lowName = names.low;
        this.highName = names.high;
        this.typeName = names.type;
    }

    protected prepare() {
        return;
    }
    protected abstract buildType(): TypeAsObj;

    public filepath() {
        return `${this.$t}__${this.lowName}.ts`;
    }

    private bridgeImports(): string {
        let imports = '';
        const uniqueImports = new Set(this.bridge?.imports || [])
        for (const imp of uniqueImports) {
            imports += imp + '\n';
        }
        return imports;
    }

    protected customImports(nesoiPath: string): string {
        return ''
    }

    public dumpFileSchema(nesoiPath: string) {
        this.prepare();
        return `import { ${this.typeName} } from '../${this.module}.module'\n`
           + this.bridgeImports()
           + this.customImports(nesoiPath)
           + '\n'
           + `const ${this.typeName}: ${this.typeName} = ${DumpHelpers.dumpSchema(this.schema)}\n`
           + `export default ${this.typeName}`;
    }

    // Cache is only used on CachedElement
    public dumpTypeSchema(cache?: ProgressiveBuildCache) {
        this.type = this.buildType();
        const typeschema = {
            'constants': '$Constants',
            'externals': '$Externals',
            'message': '$Message',
            'bucket': '$Bucket',
            'job': '$Job',
            'resource': '$Resource',
            'machine': '$Machine',
            'controller': '$Controller',
            'queue': '$Queue',
            'topic': '$Topic',
        }[this.$t];
        return `export interface ${this.typeName} extends ${typeschema} ${DumpHelpers.dumpType(this.type)};\n`;
    }

    public static makeAuthnType(auth: $BlockAuth[]) {
        if (auth.length === 0) {
            return '{}';
        }
        const type: ObjTypeAsObj = {};
        auth.forEach(a => {
            type[a.provider] = `AuthnUsers['${a.provider}']`;
        });
        return type;
    }

    public static makeIOType(compiler: Compiler, schema: $Job | $Machine | $MachineState | $MachineTransition | $Queue | $Topic) {
        const input = schema.input.map(msg => {
            const schema = Tag.resolve(msg, compiler.tree) as $Message;
            const msgName = NameHelpers.names(schema);
            return msgName.type;
        });
        const _input = new Set(input);

        const output = schema['#output'] || this.makeOutputType(compiler, schema)
        
        return {
            input: _input.size ? [..._input].join(' | ') : 'never',
            output
        };
    }

    public static makeOutputType(compiler: Compiler, schema: $Block) {
        const raw = schema.output?.raw ? DumpHelpers.dumpType(schema.output.raw) : undefined;
        const msgs = schema.output?.msg?.map(msg => {
            const schema = Tag.resolve(msg, compiler.tree) as $Message;
            const msgName = NameHelpers.names(schema);
            return msgName.type;
        });
        const objs = schema.output?.obj?.map(bucket => {
            const schema = Tag.resolve(bucket.tag, compiler.tree) as $Message;
            const bucketName = NameHelpers.names(schema);
            return bucketName.high + (bucket.many ? '[]' : '');
        });
        const type = [
            raw,
            ...msgs || [],
            ...objs || []
        ].join(' | ')
        
        return type || 'unknown';
    }

}
