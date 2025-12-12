import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { Compiler } from '../compiler';

import { Tag } from '~/engine/dependency';
import { NameHelpers } from '~/engine/util/name_helpers';
import { SchemaDumper } from '../schema';

/* @nesoi:browser ignore-start */
import { t, TypeInterface } from '../types/type_compiler';
import type { AnyElementSchema, TagType, $BlockAuth } from 'index';
/* @nesoi:browser ignore-end */
export abstract class Element<T extends AnyElementSchema> {

    public static Any = Symbol('undefined as any') as any;
    public static Never = Symbol('undefined as never') as any;

    public interface!: TypeInterface;
    public child_interfaces: TypeInterface[] = [];
    
    public tag: Tag;
    public lowName: string;
    public highName: string;
    
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

        this.interface = new TypeInterface(names.type)
    }

    /**
     * Modify schema before saving it.
     */
    protected prepare() {
        return;
    }

    /**
     * Build the type interface for this element
     */
    protected abstract buildInterfaces(): void;

    // filepath

    public filepath() {
        return `${this.$t}__${this.lowName}.ts`;
    }

    // imports

    private bridgeImports(): string {
        let imports = '';
        const uniqueImports = new Set(this.bridge?.imports || [])
        for (const imp of uniqueImports) {
            imports += imp + '\n';
        }
        return imports;
    }

    protected customSchemaImports(nesoiPath: string): string {
        return ''
    }

    // dump

    public dumpSchema(nesoiPath: string): string {
        this.prepare();
        const dump = `import { ${this.interface.name} } from '../${this.module}.module'\n`
           + this.bridgeImports()
           + this.customSchemaImports(nesoiPath)
           + '\n'
           + `const ${this.interface.name}: ${this.interface.name} = ${SchemaDumper.dump(this.schema)}\n`
           + `export default ${this.interface.name}`;
        return dump;
    }

    // [makers]

    public makeAuthType(auth?: $BlockAuth[]) {
        if (!auth) {
            if (!('auth' in this.schema)) return t.never();
            if (this.schema.auth.length === 0) return t.obj({});
            auth = this.schema.auth;
        }
        
        const type = t.obj({})
        auth.forEach(auth => {
            type.children[auth.provider] = t.user(auth.provider)
        })

        return type;
    }

    public makeInputType() {
        if (!('input' in this.schema)) return t.never();
        if (this.schema.input.length === 0) return t.never();

        return t.union(
            this.schema.input.map(tag => t.message(tag, 'raw'))
        )
    }

    public makeOutputType() {
        if (!('output' in this.schema)) return t.never();
        if (!this.schema.output) return t.unknown();

        const raw = this.schema.output?.raw ? [t.literal(this.schema.output.raw.toString())] : [];
        const msgs = this.schema.output?.msg?.map(msg => t.message(msg, 'parsed')) ?? [];
        const objs = this.schema.output?.obj?.map(bucket => {
            if (bucket.many) {
                return t.list(t.bucket(bucket.tag))
            }
            else {
                return t.bucket(bucket.tag)
            }
        }) ?? [];
        const type = t.union([
            ...raw,
            ...msgs,
            ...objs
        ])
        
        return type;
    }

}
