import { $Module, $Space } from '~/schema';
import { $BucketModelField, $BucketModelFieldCrypto, $BucketModelFieldType, $BucketModelFields } from './bucket_model.schema';
import { NesoiDate } from '~/engine/data/date';
import { BucketModelpathObjInfer, BucketModelpathDictInfer, BucketModelpathListInfer, BucketModelObjInfer, BucketQuerypathDictInfer, BucketQuerypathListInfer, BucketQuerypathObjInfer, BucketModelpathUnionInfer } from './bucket_model.infer';
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

        return new BucketModelFieldBuilder<Module, O, O>(this.module, 'enum', this.alias, {
            enum: { options: strings, dep }
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
        type Modelpath = { '': Data } & { '.*': Data } & BucketModelpathObjInfer<T>
        type Querypath = { '': Data } & BucketQuerypathObjInfer<T>
        return new BucketModelFieldBuilder<Module, Data, Data, [false, false], Modelpath, Querypath>(this.module, 'obj', this.alias, undefined, fields);
    }

    /**
     * An object with an unknown number of child fields of a given type.
     * 
     * - All child fields are optional. You can specify a default value.
     */
    dict<T extends BucketModelFieldBuilder<Module, any, any, any, any>>(dictItem: T) {
        type Input = Record<string, T['#input']>
        type Output = Record<string, T['#output']>
        type Modelpath = { '': Record<string,T['#output']> } & BucketModelpathDictInfer<T>
        type Querypath = { '': Record<string,T['#output']> } & BucketQuerypathDictInfer<T>
        return new BucketModelFieldBuilder<Module, Input, Output, [false, false], Modelpath, Querypath>(
            this.module, 'dict', this.alias, undefined, { '#': dictItem }
        );
    }

    /**
     * A list of a given type
     * - All child fields are optional. You can specify a default value.
     */
    list<T extends BucketModelFieldBuilder<Module, any, any, any, any>>(listItem: T) {
        type Input = T['#input'][]
        type Output = T['#output'][]
        type Modelpath = { '': T['#output'][] } & BucketModelpathListInfer<T>
        type Querypath = { '': T['#output'][] } & BucketQuerypathListInfer<T>
        return new BucketModelFieldBuilder<Module, Input, Output, [false, false], Modelpath, Querypath>(
            this.module, 'list', this.alias, undefined, { '#': listItem }
        );
    }

    union<
        Builders extends AnyBucketModelFieldBuilder[],
    >(...children: Builders) {
        type Input = Builders[number]['#input']
        type Output = Builders[number]['#output']
        type Modelpath = BucketModelpathUnionInfer<Builders>
        type Querypath = Builders[number]['#querypath']
        return new BucketModelFieldBuilder<Module, Input, Output, [false, false], Modelpath, Querypath>(
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
    Optional = [false, false],
    Modelpath = { '': Output },
    Querypath = { '': Output }
> {
    public '#input': Input
    public '#output': Output
    public '#optional': Optional
    public '#modelpath': Modelpath
    public '#querypath': Querypath

    private _required = true;
    private _defaultValue?: any = undefined;
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
     * This field can be `undefined` or `null`.
     */
    get optional(): BucketModelFieldBuilder<
        Module,
        Input | null | undefined,
        Output | null | undefined,
        [true, true],
        { [K in keyof Modelpath]: Modelpath[K] | null | undefined },
        { [K in keyof Querypath]: Querypath[K] | null | undefined }
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
        [true, (Optional & [boolean, boolean])[1]],
        Modelpath,
        Querypath
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
        this.crypto = {
            algorithm,
            key: key as string
        }
    }

    // Build

    public static build(builder: AnyBucketModelFieldBuilder, name: string, basePath: string = ''): {
        schema: $BucketModelField,
        hasFile: boolean,
        hasEncrypted: boolean
    } {

        const path = basePath + name;
        const childrenPath = path + '.';

        const children = builder.children
            ? BucketModelFieldBuilder.buildChildren(builder.module, builder.children, childrenPath)
            : undefined;

        const defaults = builder._defaultValue && builder.children
            ? Object.assign({}, builder._defaultValue, children?.defaults)
            : builder._defaultValue;

        const schema = new $BucketModelField(
            name,
            path,
            builder.type,
            builder.alias || name,
            builder._required,
            builder.meta,
            defaults,
            children?.schema,
            builder.crypto
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
    [x: string]: BucketModelFieldBuilder<Module, any, any, any, any, any> | BucketModelFieldBuilders<Module>
}

export type AnyBucketModelFieldBuilder = BucketModelFieldBuilder<any, any, any, any, any, any>