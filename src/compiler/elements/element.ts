import { ResolvedBuilderNode } from '~/engine/dependency';
import { AnyElementSchema } from '~/engine/module';
import { $Machine, $MachineState, $MachineTransition } from '~/elements/blocks/machine/machine.schema';
import { $Job } from '~/elements/blocks/job/job.schema';
import { $Queue } from '~/elements/blocks/queue/queue.schema';
import { Compiler } from '../compiler';
import { NameHelpers } from '../helpers/name_helpers';
import { DumpHelpers } from '../helpers/dump_helpers';
import { $Block } from '~/elements/blocks/block.schema';

export type TypeAsObj = string | (
    { [x: string] : TypeAsObj }
    & {
        __array?: boolean,
        __optional?: boolean
        __or?: TypeAsObj
    }
)
export type ObjTypeAsObj = TypeAsObj & Record<string, any>

export abstract class Element<T extends AnyElementSchema> {

    public static Any = Symbol('undefined as any') as any;
    public static Never = Symbol('undefined as never') as any;

    public type!: TypeAsObj;
    
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
        for (const imp of this.bridge?.imports || []) {
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

    public dumpTypeSchema() {
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
        }[this.$t];
        return `export interface ${this.typeName} extends ${typeschema} ${DumpHelpers.dumpType(this.type)};\n`;
    }

    public static makeAuthnType(authn: string[]) {
        if (authn.length === 0) {
            return '{}';
        }
        const type: ObjTypeAsObj = {};
        authn.forEach(provider => {
            type[provider] = `AuthnUsers['${provider}']`;
        });
        return type;
    }

    public static makeIOType(compiler: Compiler, schema: $Job | $Machine | $MachineState | $MachineTransition | $Queue) {
        const input = schema.input.map(msg => {
            const schema = compiler.tree.getSchema(msg);
            const msgName = NameHelpers.names(schema);
            return msgName.type;
        });

        const output = schema['#output'] || this.makeOutputType(compiler, schema)
        
        return {
            input: input.length ? input.join(' | ') : 'never',
            output
        };
    }

    public static makeOutputType(compiler: Compiler, schema: $Block) {
        const raw = schema.output?.raw ? DumpHelpers.dumpType(schema.output.raw) : undefined;
        const msgs = schema.output?.msg?.map(msg => {
            const schema = compiler.tree.getSchema(msg);
            const msgName = NameHelpers.names(schema);
            return msgName.type;
        });
        const objs = schema.output?.obj?.map(bucket => {
            const schema = compiler.tree.getSchema(bucket);
            const bucketName = NameHelpers.names(schema);
            return bucketName.high;
        });
        const type = [
            raw,
            ...msgs || [],
            ...objs || []
        ].join(' | ')
        
        return type || 'unknown';
    }

}
