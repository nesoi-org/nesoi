import type { BucketModelObjInfer } from './bucket_model.infer';
import type { ModuleTree } from '~/engine/tree';

import { $BucketModelField } from './bucket_model.schema';
import { Dependency, Tag } from '~/engine/dependency';import type { NesoiDate } from '~/engine/data/date';
import type { NesoiDatetime } from '~/engine/data/datetime';
import type { NesoiDuration } from '~/engine/data/duration';
import type { NesoiDecimal } from '~/engine/data/decimal';
import type { NesoiFile } from '~/engine/data/file';

/*
    Factory
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketModelFieldFactory<
    Space extends $Space,
    Module extends $Module
>{
    constructor(
        private module: string
    ) {}

    private alias?: string;

    as(alias: string) {
        this.alias = alias;
        return this as Omit<typeof this, 'as'>;
    }

    get any() {
        return new BucketModelFieldBuilder<Module, any, any>(this.module, 'unknown', this.alias);
    }

    get boolean() {
        return new BucketModelFieldBuilder<Module, boolean, boolean>(this.module, 'boolean', this.alias);
    }
    
    get date() {
        return new BucketModelFieldBuilder<Module, NesoiDate, NesoiDate>(this.module, 'date', this.alias);
    }
     
    get datetime() {
        return new BucketModelFieldBuilder<Module, NesoiDatetime, NesoiDatetime>(this.module, 'datetime', this.alias);
    }
     
    get duration() {
        return new BucketModelFieldBuilder<Module, NesoiDuration, NesoiDuration>(this.module, 'duration', this.alias);
    }
     
    decimal(def?: { left?: number, right?: number }) {
        return new BucketModelFieldBuilder<Module, NesoiDecimal, NesoiDecimal>(this.module, 'decimal', this.alias, {
            decimal: def
        });
    }
    
    enum<
        Enums extends Module['constants']['enums'],
        Options extends (keyof Enums & string) | (readonly string[])
    >(options: Options)  {
        type O = Options extends string
            ? keyof Module['constants']['enums'][Options]['#data']
            : Options extends (infer X)[] | readonly (infer X)[]
                ? X
                : Options[keyof Options];
                
        let meta;
        if (typeof options === 'string') {
            const tag = Tag.fromNameOrShort(this.module, 'constants.enum', options);
            meta = { dep: new Dependency(this.module, tag, { build: true }) }
        }
        else if (Array.isArray(options)) {
            const opts: Record<string, any> = {};
            for (const opt of options) opts[opt] = opt;
            meta = { options: opts }
        }
        else {
            meta = { options: options as Record<string, any> }
        }

        return new BucketModelFieldBuilder<Module, O, O>(this.module, 'enum', this.alias, {
            enum: meta
        });
    }
    
    get int() {
        return new BucketModelFieldBuilder<Module, number, number>(this.module, 'int', this.alias);
    }
    
    get float() {
        return new BucketModelFieldBuilder<Module, number, number>(this.module, 'float', this.alias);
    }

    get string() {
        return new BucketModelFieldBuilder<Module, string, string>(this.module, 'string', this.alias);
    }

    literal<T extends string>(template: RegExp) {
        return new BucketModelFieldBuilder<Module, T, T>(this.module, 'literal', this.alias, {
            literal: {
                template: template.toString().slice(1,-1)
            }
        });
    }

    file(def?: { extnames?: string[], maxsize?: number }) {
        return new BucketModelFieldBuilder<Module, NesoiFile, NesoiFile>(this.module, 'file', this.alias, {
            file: def
        });
    }

    /**
     * An object with a specific set of child fields.
     */
    obj<
        T extends BucketModelFieldBuilders<Module>
    >(fields?: T) {
        type Data = BucketModelObjInfer<T>
        return new BucketModelFieldBuilder<Module, Data, Data, [false, false]>(this.module, 'obj', this.alias, undefined, fields);
    }

    /**
     * An object with an unknown number of child fields of a given type.
     * 
     * - All child fields are optional. You can specify a default value.
     */
    dict<T extends BucketModelFieldBuilder<Module, any, any, any>>(item: T) {
        type Input = Record<string, T['#input']>
        type Output = Record<string, T['#output']>
        return new BucketModelFieldBuilder<Module, Input, Output, [false, false]>(
            this.module, 'dict', this.alias, undefined, { '#': item }
        );
    }

    /**
     * A list of a given type
     * - All child fields are optional. You can specify a default value.
     */
    list<T extends BucketModelFieldBuilder<Module, any, any, any>>(item: T) {
        type Input = T['#input'][]
        type Output = T['#output'][]
        return new BucketModelFieldBuilder<Module, Input, Output, [false, false]>(
            this.module, 'list', this.alias, undefined, { '#': item }
        );
    }

    union<
        Builders extends AnyBucketModelFieldBuilder[],
    >(...children: Builders) {
        type Input = Builders[number]['#input']
        type Output = Builders[number]['#output']
        return new BucketModelFieldBuilder<Module, Input, Output, [false, false]>(
            this.module,
            'union',
            this.alias,
            undefined,
            Object.fromEntries(children.map((c,i) => [i,c])) as never
        );
    }

}

/*
    Builder
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketModelFieldBuilder<
    Module extends $Module,
    Input,
    Output,
    Optional = [false, false]
> {
    public '#input': Input
    public '#output': Output
    public '#optional': Optional

    private _required = true;
    private _defaultValue?: any = undefined;
    private crypto?: {
        algorithm: string,
        value: Dependency
    }
    
    constructor(
        private module: string,
        private type: $BucketModelFieldType,
        private alias?: string,
        private meta?: Omit<NonNullable<$BucketModelField['meta']>,'enum'> & {
            enum?: { options: Record<string, any> } | { dep: Dependency }
        },
        private children?: BucketModelFieldBuilders<Module>
    ) {}

    as(alias: string) {
        this.alias = alias;
        return this;
    }

    /**
     * This field can be `undefined` or `null`.
     */
    get optional(): BucketModelFieldBuilder<
        Module,
        Input | null | undefined,
        Output | null | undefined,
        [true, true]
        > {
        this._required = false;
        return this as never;
    }
    
    /**
     * If this field is undefined on the source, it will be
     * read as the given value.
     * Also, when a message is generated for this model,
     * the field can be undefined on the input and will have this value
     * after parsed.
     */
    default(defaultValue: Output): BucketModelFieldBuilder<
        Module,
        Input | undefined,
        Output,
        [true, (Optional & [boolean, boolean])[1]]
    > {
        this._required = false;
        this._defaultValue = defaultValue;
        return this as never;
    }

    /**
     * This can be applied to `string` and `enum` fields,
     * to control storage performance.
     * - `null` means unconstrained length
     * - `number` must be an integer number, if not it's floored
     * > Notice: `enum` has a default max length of 64.
     * > `string` is unconstrained by default.
     * > If you want unconstrained enum you must specify `null` here.
     */
    maxLength(val: number | null) {

    }

    encrypt(key: keyof Module['constants']['values'], algorithm: string = 'aes256') {
        const tag = Tag.fromNameOrShort(this.module, 'constants.value', key as string);
        this.crypto = {
            algorithm,
            value: new Dependency(this.module, tag, { build: true })
        }
        return this;
    }

    // Build

    public static build(tree: ModuleTree, builder: AnyBucketModelFieldBuilder, name: string, basePath: string = ''): {
        schema: $BucketModelField,
        hasFile: boolean,
        hasEncrypted: boolean
    } {

        const path = basePath + name;
        const childrenPath = path + '.';

        if (builder.type === 'enum' && 'dep' in builder.meta!.enum!) {               
            const schema = Tag.resolve(builder.meta!.enum.dep!.tag, tree) as $ConstantEnum;
            builder.meta!.enum = { options: schema.options }
        }

        if (builder.type === 'list' || builder.type === 'dict') {
            const item = builder.children!['#'];
            if (!((item as any).alias as AnyBucketModelFieldBuilder['alias'])) {
                item.as(`Item of ${builder.alias || name}`);
            }
        }

        const children = builder.children
            ? BucketModelFieldBuilder.buildChildren(tree, builder.module, builder.children, childrenPath)
            : undefined;

        let defaultValue = builder._defaultValue;
        if (builder.type === 'list') {
            defaultValue = builder._defaultValue;
        }
        else if (builder.type === 'dict') {
            defaultValue = builder._defaultValue;
        }
        else if (builder.type === 'obj') {
            defaultValue = builder._defaultValue && builder.children
                ? Object.assign({}, builder._defaultValue, children?.defaults)
                : builder._defaultValue;
        }
        else if (builder.type === 'union') {
            defaultValue = builder._defaultValue ?? Object.values(children!.defaults).find(v => v !== null);
        }

        const schema = new $BucketModelField(
            name,
            path,
            builder.type,
            builder.alias || name,
            builder._required,
            builder.meta as $BucketModelField['meta'],
            defaultValue,
            children?.schema,
            builder.crypto ? {
                algorithm: builder.crypto.algorithm,
                value: builder.crypto.value.tag
            } : undefined
        );

        const hasFile =
            builder.type === 'file'
            || children?.hasFileField
            || false

        const hasEncrypted =
            !!builder.crypto
            || children?.hasEncryptedField
            || false;

        return { schema, hasFile, hasEncrypted }
    }

    public static buildChildren(tree: ModuleTree, module: string, children: BucketModelFieldBuilders<any>, path?: string): {
        schema: $BucketModelFields,
        defaults: Record<string, any>,
        hasFileField: boolean,
        hasEncryptedField: boolean
    } {
        const schema = {} as $BucketModelFields;
        const defaults = {} as Record<string, any>;
        let hasFileField = false;
        let hasEncryptedField = false;
        for (const c in children) {
            const child = children[c];
            const out = BucketModelFieldBuilder.build(tree, child, c, path);
            schema[c] = out.schema;
            hasFileField ||= out.hasFile;
            hasEncryptedField ||= out.hasEncrypted;
            defaults[c] = schema[c].defaultValue;
        }
        return { schema, defaults, hasFileField, hasEncryptedField };
    }

}

/*
    Collection
*/

export type BucketModelFieldBuilders<
    Module extends $Module
> = {
    [x: string]: BucketModelFieldBuilder<Module, any, any, any>
}

export type AnyBucketModelFieldBuilder = BucketModelFieldBuilder<any, any, any, any>