import { $Module, $Space } from '~/schema';
import { $BucketModelField, $BucketModelFieldCrypto, $BucketModelFieldType, $BucketModelFields } from './bucket_model.schema';
import { NesoiDate } from '~/engine/data/date';
import { BucketFieldpathObjInfer, BucketModelObjInfer } from './bucket_model.infer';
import { $Dependency, $Tag } from '~/engine/dependency';
import { EnumFromName, EnumName } from '../../constants/constants.schema';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiFile } from '~/engine/data/file';
import { NesoiDuration } from '~/engine/data/duration';

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
        return new BucketModelFieldBuilder<Module, any>(this.module, 'unknown', this.alias);
    }

    get boolean() {
        return new BucketModelFieldBuilder<Module, boolean>(this.module, 'boolean', this.alias);
    }
    
    get date() {
        return new BucketModelFieldBuilder<Module, NesoiDate>(this.module, 'date', this.alias);
    }
     
    get datetime() {
        return new BucketModelFieldBuilder<Module, NesoiDatetime>(this.module, 'datetime', this.alias);
    }
     
    get duration() {
        return new BucketModelFieldBuilder<Module, NesoiDuration>(this.module, 'duration', this.alias);
    }
     
    decimal(def?: { left?: number, right?: number }) {
        return new BucketModelFieldBuilder<Module, NesoiDecimal>(this.module, 'decimal', this.alias, {
            decimal: def
        });
    }
    
    enum<
        Enums extends EnumName<Space>,
        Options extends (keyof Enums & string) | (readonly string[])
    >(options: Options)  {
        type O = Options extends string
            ? EnumFromName<Space, Options>['#data']
            : Options extends (infer X)[] | readonly (infer X)[]
                ? X
                : Options[keyof Options];
        const strings = (Array.isArray(options) || typeof options === 'string')
            ? options
            : Object.keys(options);

        let dep;
        if (typeof options === 'string') {
            const tag = $Tag.parseOrFail(options);
            if (tag.module) {
                dep = new $Dependency(this.module, 'constants', `${tag.module}::*`)
            }
            else {
                dep = new $Dependency(this.module, 'constants', '*')
            }
        }

        return new BucketModelFieldBuilder<Module, O>(this.module, 'enum', this.alias, {
            enum: { options: strings, dep }
        });
    }
    
    get int() {
        return new BucketModelFieldBuilder<Module, number>(this.module, 'int', this.alias);
    }
    
    get float() {
        return new BucketModelFieldBuilder<Module, number>(this.module, 'float', this.alias);
    }

    get string() {
        return new BucketModelFieldBuilder<Module, string>(this.module, 'string', this.alias);
    }


    /**
     * An object with a specific set of child fields.
     */
    obj<
        T extends BucketModelFieldBuilders<Module>
    >(fields?: T) {
        type Data = BucketModelObjInfer<T>
        type Fieldpath = { '': Data } & BucketFieldpathObjInfer<T, '.'>
        return new BucketModelFieldBuilder<Module, Data, never, Data, Fieldpath>(this.module, 'obj', this.alias, undefined, fields);
    }

    /**
     * An object with an unknown number of child fields of a given type.
     * 
     * - All child fields are optional. You can specify a default value.
     */
    dict<T extends BucketModelFieldBuilder<Module, any>>(dictItem: T) {
        type Item = T extends BucketModelFieldBuilder<any, any, any, infer X>
            ? X
            : never
        type Data = Record<string, Item>
        type Fieldpath = { '': Data } & BucketFieldpathObjInfer<{ '': T }, '.#'>
        dictItem = dictItem.optional as any
        return new BucketModelFieldBuilder<Module, Data, never, Data, Fieldpath>(this.module, 'dict', this.alias, undefined, { __dict: dictItem });
    }

    file(def?: { extnames?: string[], maxsize?: number }) {
        return new BucketModelFieldBuilder<Module, NesoiFile>(this.module, 'file', this.alias, {
            file: def
        });
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
    DefinedData,
    TypeAppend = never,
    Data = DefinedData | TypeAppend,
    Fieldpath = { '': Data }
> {

    private _array = false;
    private _required = true;
    private _defaultValue?: DefinedData = undefined;
    private _or?: AnyBucketModelFieldBuilder
    private crypto?: $BucketModelFieldCrypto
    
    constructor(
        private module: string,
        private type: $BucketModelFieldType,
        private alias?: string,
        private meta?: $BucketModelField['meta'],
        private children?: BucketModelFieldBuilders<Module>
    ) {}

    as(alias: string) {
        this.alias = alias;
        return this;
    }

    /**
     * This field can be `undefined`.
     */
    get optional() {
        this._required = false;
        return this as BucketModelFieldBuilder<
            Module,
            DefinedData,
            /* TypeAppend */ undefined,
            DefinedData | undefined,
            { [K in keyof Fieldpath]: Fieldpath[K] | undefined }
        >;
    }
    
    /**
     * If this field is undefined on the source, it will be
     * read as the given value.
     * Also, when creating or updating the model through a default
     * resource method, this value is used if undefined is passed.
     */
    default(defaultValue: DefinedData) {
        this._required = false;
        this._defaultValue = defaultValue;
        return this as unknown as BucketModelFieldBuilder<
            Module,
            DefinedData,
            /* TypeAppend */ never,
            DefinedData,
            Fieldpath
            // WARN: If .optional is used before default, the
            // inferred fieldpath won't work. It doesn't make
            // sense, anyway, so it's invalid syntax.
        >;
    }

    get array() {
        this._array = true;
        return this as BucketModelFieldBuilder<
            Module,
            DefinedData[],
            /* TypeAppend */ TypeAppend,
            DefinedData[] | TypeAppend,
            {
                [K in Exclude<keyof Fieldpath, ''> as `.#${K & string}`]: Fieldpath[K]
            } & {
                '': DefinedData[] | TypeAppend
                '.#': DefinedData | TypeAppend
            }
        >;
    }

    or<
        Def extends AnyBucketModelFieldBuilder
    >(def: Def) {
        this._or = def;
        type D = Def extends BucketModelFieldBuilder<any, any, any, infer X> ? X : never;
        type F = Def extends BucketModelFieldBuilder<any, any, any, any, infer X> ? X : never;
        return this as any as BucketModelFieldBuilder<
            Module,
            DefinedData | D,
            TypeAppend,
            DefinedData | D | TypeAppend,
            {
                [K in Exclude<keyof Fieldpath, ''>]: Fieldpath[K] | (K extends keyof F ? F[K] : undefined)
            } & {
                '': DefinedData | D | TypeAppend
            } & {
                [K in Exclude<keyof F, ''>]: F[K]
            }
        >;
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
        this.crypto = {
            algorithm,
            key: key as string
        }
    }

    // Build

    public static build(builder: BucketModelFieldBuilder<any, any>, name: string, path: string = ''): {
        schema: $BucketModelField,
        hasFile: boolean,
        hasEncrypted: boolean
    } {

        path += name;

        const children = builder.children
            ? BucketModelFieldBuilder.buildChildren(builder.module, builder.children,
                builder._array
                    ? path+'.#.'
                    : path+'.'
            )
            : undefined;

        const defaults = builder._defaultValue && builder.children
            ? Object.assign({}, builder._defaultValue, children?.defaults)
            : builder._defaultValue;

        const or = builder._or
            ? this.build(builder._or, name)
            : undefined;

        const schema = new $BucketModelField(
            name,
            path,
            builder.type,
            builder.alias || name,
            builder._array,
            builder._required,
            builder.meta,
            defaults,
            children?.schema,
            or?.schema,
            builder.crypto
        );

        const hasFile =
            builder.type === 'file'
            || children?.hasFileField
            || or?.hasFile
            || false

        const hasEncrypted =
            !!builder.crypto
            || children?.hasEncryptedField
            || or?.hasEncrypted
            || false;

        return { schema, hasFile, hasEncrypted }
    }

    public static buildChildren(module: string, children: BucketModelFieldBuilders<any>, path?: string): {
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
            if (child instanceof BucketModelFieldBuilder) {
                const out = BucketModelFieldBuilder.build(child, c, path);
                schema[c] = out.schema;
                hasFileField ||= out.hasFile;
                hasEncryptedField ||= out.hasEncrypted;
            }
            // Builders are allowed to implicitly declare nested fields.
            // The code below transforms these groups into fields of the scope 'group'.
            else {
                const fieldTypeBuilder = new BucketModelFieldFactory(module);
                const fieldBuilder = fieldTypeBuilder.obj(child as any);
                const out = BucketModelFieldBuilder.build(fieldBuilder, c, path);
                schema[c] = out.schema;
                hasFileField ||= out.hasFile;
                hasEncryptedField ||= out.hasEncrypted;
            }
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
    [x: string]: BucketModelFieldBuilder<Module, any> | BucketModelFieldBuilders<Module>
}

export type AnyBucketModelFieldBuilder = BucketModelFieldBuilder<any, any>