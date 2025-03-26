import { ResolvedBuilderNode } from '~/engine/dependency';
import { $ConstantEnum, $ConstantEnumOption, $ConstantValue, $Constants } from './constants.schema';


/**
 * Value
 */

export class ConstantValueBuilder {

    constructor(
        private scope: string,
        private key?: string,
        private value?: any,
    ) {}

    // Build

    public static build(key: string, builder: ConstantValueBuilder) {
        return new $ConstantValue(
            builder.scope,
            builder.key || key,
            builder.value
        );
    }
}

export class ConstantValueFactory {
    static<T>(value: T) {
        return new ConstantValueBuilder('static', undefined, value);
    }

    runtime<T>(key?: string) {
        return new ConstantValueBuilder('runtime', key);
    }
}

type ConstantValueDef = ($: ConstantValueFactory) => Record<string, ConstantValueBuilder>

/**
 * Enum
 */

export class ConstantEnumOptionBuilder {

    constructor(
        private value: any,
    ) {}

    // Build

    public static build(key: string, builder: ConstantEnumOptionBuilder) {
        return new $ConstantEnumOption(
            key,
            builder.value
        );
    }
    
}
export class ConstantEnumOptionFactory<T> {
    opt(value: T) {
        return new ConstantEnumOptionBuilder(value);
    }
}

type ConstantEnumOptionBuilders = Record<string, ConstantEnumOptionBuilder>

type ConstantEnumOptionDef<T> = ($: ConstantEnumOptionFactory<T>) => ConstantEnumOptionBuilders

export class ConstantEnumBuilder {

    constructor(
        public name: string,
        public options: ConstantEnumOptionBuilders,
    ) {}

    // Build

    public static build(builder: ConstantEnumBuilder) {
        return new $ConstantEnum(
            builder.name,
            this.buildOptions(builder.options)
        );
    }

    private static buildOptions(builders: ConstantEnumOptionBuilders) {
        const options = {} as Record<string, $ConstantEnumOption>;
        for (const k in builders) {
            options[k] = ConstantEnumOptionBuilder.build(k, builders[k]);
        }
        return options;
    }
    
}

/**
 * Constants
 */

export class ConstantsBuilder {
    public $b = 'constants' as const;
    public name = '*';

    private _values: Record<string, ConstantValueBuilder> = {};
    private enums: Record<string, ConstantEnumBuilder> = {};

    constructor(
        private module: string
    ) {}

    values($: ConstantValueDef) {
        const factory = new ConstantValueFactory();
        this._values = $(factory);
        return this;
    }

    enum<T>(name: string, $: ConstantEnumOptionDef<T>) {
        const factory = new ConstantEnumOptionFactory();
        const options = $(factory);
        this.enums[name] = new ConstantEnumBuilder(name, options);
        return this;
    }

    public static merge(to: ConstantsBuilder, from: ConstantsBuilder) {
        Object.assign(to._values, from._values);
        Object.assign(to.enums, from.enums);
    }

    // Build

    public static build(node: ConstantsBuilderNode) {
        const values = {} as Record<string, $ConstantValue>;
        const enums = {} as Record<string, $ConstantEnum>;
        for (const k in node.builder._values) {
            values[k] = ConstantValueBuilder.build(k, node.builder._values[k]);
        }
        for (const k in node.builder.enums) {
            enums[k] = ConstantEnumBuilder.build(node.builder.enums[k]);

            // Spread enum into multiple enums if it has one or more "." on it's name
            const split = k.split('.');
            if (split.length > 1) {
                let parent = '';
                for (let i=0; i<split.length-1; i++) {
                    parent = parent.length ? (`${parent}.${split[i]}`) : split[i];
                    enums[parent] ??= new $ConstantEnum(parent, {});
                    Object.assign(enums[parent].options, enums[k].options);
                }
            }
        }
        node.schema = new $Constants(node.module, values, enums);
        return node.schema;
    }
    
}

export type ConstantsBuilderNode = ResolvedBuilderNode & {
    builder: ConstantsBuilder,
    schema?: $Constants
}