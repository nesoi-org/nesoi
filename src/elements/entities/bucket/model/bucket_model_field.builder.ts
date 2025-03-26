import { $Module, $Space } from '~/schema';
import { $BucketModelField, $BucketModelFieldType, $BucketModelFields } from './bucket_model.schema';
import { NesoiDate } from '~/engine/data/date';
import { BucketFieldpathObjInfer, BucketModelObjInfer } from './bucket_model.infer';
import { $Dependency, $Tag } from '~/engine/dependency';
import { EnumFromName, EnumName } from '../../constants/constants.schema';
import { Decimal } from '~/engine/data/decimal';
import { NesoiDatetime } from '~/engine/data/datetime';

/*
    Factory
*/

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
     
    decimal(def?: { left?: number, right?: number }) {
        // TODO: store definition on schema
        return new BucketModelFieldBuilder<Module, Decimal>(this.module, 'decimal', this.alias);
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

        return new BucketModelFieldBuilder<Module, O>(this.module, 'enum', this.alias, { options: strings, dep });
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

    obj<
        T extends BucketModelFieldBuilders<Module>
    >(fields?: T) {
        type Data = BucketModelObjInfer<T>
        type Fieldpath = { '': Data } & BucketFieldpathObjInfer<T, '.'>
        return new BucketModelFieldBuilder<Module, Data, never, Data, Fieldpath>(this.module, 'obj', this.alias, undefined, fields);
    }

    dict<T extends BucketModelFieldBuilder<Module, any>>(dictItem: T) {
        type Item = T extends BucketModelFieldBuilder<any, any, any, infer X>
            ? X
            : never
        type Data = Record<string, Item>
        type Fieldpath = { '': Data } & BucketFieldpathObjInfer<{ '': T }, '.*'>
        return new BucketModelFieldBuilder<Module, Data, never, Data, Fieldpath>(this.module, 'dict', this.alias, undefined, { __dict: dictItem });
    }

}

/*
    Builder
*/

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
    
    constructor(
        private module: string,
        private type: $BucketModelFieldType,
        private alias?: string,
        private _enum?: {
            options: string | string[],
            dep?: $Dependency
        },
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
                [K in Exclude<keyof Fieldpath, ''> as `.*${K & string}`]: Fieldpath[K]
            } & {
                '': DefinedData[] | TypeAppend
                '.*': DefinedData | TypeAppend
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

    // Build

    public static build(builder: BucketModelFieldBuilder<any, any>, name: string) {

        const children = builder.children
            ? BucketModelFieldBuilder.buildChildren(builder.module, builder.children)
            : undefined;

        const defaults = builder._defaultValue && builder.children
            ? Object.assign({}, builder._defaultValue, children?.defaults)
            : builder._defaultValue;

        const or: any = builder._or
            ? this.build(builder._or, name)
            : undefined;

        return new $BucketModelField(
            name,
            builder.type,
            builder.alias || name,
            builder._array,
            builder._required,
            builder._enum,
            defaults,
            children?.schema,
            or
        );
    }

    public static buildChildren(module: string, children: BucketModelFieldBuilders<any>) {
        const schema = {} as $BucketModelFields;
        const defaults = {} as Record<string, any>;
        for (const c in children) {
            const child = children[c];
            if (child instanceof BucketModelFieldBuilder) {
                schema[c] = BucketModelFieldBuilder.build(child, c);
            }
            // Builders are allowed to implicitly declare nested fields.
            // The code below transforms these groups into fields of the scope 'group'.
            else {
                const fieldTypeBuilder = new BucketModelFieldFactory(module);
                const fieldBuilder = fieldTypeBuilder.obj(child as any);
                schema[c] = BucketModelFieldBuilder.build(fieldBuilder, c);
            }
            defaults[c] = schema[c].defaultValue;
        }
        return { schema, defaults };
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