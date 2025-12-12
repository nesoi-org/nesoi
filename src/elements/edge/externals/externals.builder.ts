import type { ResolvedBuilderNode} from '~/engine/dependency';
import type { MergeUnion } from '~/engine/util/type';
import type { ModuleTree } from '~/engine/tree';

import { $Externals } from './externals.schema';
import { Dependency, Tag } from '~/engine/dependency';
import type { $Space, $Module, $ConstantValue, $ConstantEnum, $Message } from 'index';

type MergeAllBuckets<
    Space extends $Space,
    Module extends keyof Space['modules'],
    Modules extends $Space['modules'] = Space['modules']
> = MergeUnion<{
    [M in keyof Modules]: {
        [B in keyof Modules[M]['buckets'] as `${M & string}::${B & string}`]:
            Modules[M]['buckets'][B]
    }
}[keyof Modules]>;


type ExternalBucketRefName<
    Space extends $Space,
    M extends keyof Space['modules'],
    AllBuckets = MergeAllBuckets<Space, M>
> = Exclude<
    keyof AllBuckets,
    `${M & string}::${string}`
>;

/**
 * @category Builders
 * @subcategory Edge
 */
export class ExternalsBuilder<
    Space extends $Space,
    ModuleName extends keyof Space['modules']
> { 
    public $b = 'externals' as const;
    public name = '*';

    private values: Record<string, Dependency> = {};
    private enums: Record<string, Dependency> = {};
    private buckets: Record<string, Dependency> = {};
    private messages: Record<string, Dependency> = {};
    private jobs: Record<string, Dependency> = {};
    private machines: Record<string, Dependency> = {};

    constructor(
        private module: string
    ) {}

    value<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['constants']['values']
    >(ref: `${M & string}::${B & string}`) {
        const tag = Tag.fromShort('constants.value', ref);
        this.values[tag.short] = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this;
    }
    
    enum<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['constants']['enums']
    >(ref: `${M & string}::${B & string}`) {
        const tag = Tag.fromShort('constants.enum', ref);
        this.enums[tag.short] = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this;
    }
    
    bucket<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['buckets']
    >(ref: `${M & string}::${B & string}`) {
        const tag = Tag.fromShort('bucket', ref);
        this.buckets[tag.short] = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this;
    }
    
    message<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['messages']
    >(ref: `${M & string}::${B & string}`) {
        const tag = Tag.fromShort('message', ref);
        this.messages[tag.short] = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this;
    }

    job<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['jobs']
    >(ref: `${M & string}::${B & string}`) {
        const tag = Tag.fromShort('job', ref);
        this.jobs[tag.short] = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this;
    }

    machine<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['machines']
    >(ref: `${M & string}::${B & string}`) {
        const tag = Tag.fromShort('machine', ref);
        this.machines[tag.short] = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this;
    }

    public static merge(to: AnyExternalsBuilder, from: AnyExternalsBuilder) {
        Object.assign(to.buckets, from.buckets);
        Object.assign(to.jobs, from.jobs);
    }

    // Build
    
    public static build(node: ExternalsBuilderNode, tree: ModuleTree) {

        const buckets = Object.entries(node.builder.buckets);
        const messages = Object.entries(node.builder.messages);
        const jobs = Object.entries(node.builder.jobs);
        const machines = Object.entries(node.builder.machines);
        const enums = Object.entries(node.builder.enums);
        const values = Object.entries(node.builder.values);

        // Static Externals
        const module = tree.modules[node.tag.module];
        const schema = module.schema as $Module;
        for (const value of values) {
            const tag = value[1].tag;
            schema.constants.values[tag.short] = Tag.resolve(tag, tree) as $ConstantValue
        }
        for (const _enum of enums) {
            const tag = _enum[1].tag;
            schema.constants.enums[tag.short] = Tag.resolve(tag, tree) as $ConstantEnum
        }
        for (const msg of messages) {
            const tag = msg[1].tag;
            schema.messages[tag.short] = Tag.resolve(tag, tree) as $Message
        }

        node.schema = new $Externals(
            node.tag.module,
            Object.fromEntries(values.map(e => [e[0], e[1].tag])),
            Object.fromEntries(enums.map(e => [e[0], e[1].tag])),
            Object.fromEntries(buckets.map(e => [e[0], e[1].tag])),
            Object.fromEntries(messages.map(e => [e[0], e[1].tag])),
            Object.fromEntries(jobs.map(e => [e[0], e[1].tag])),
            Object.fromEntries(machines.map(e => [e[0], e[1].tag])),
        );
        return node.schema;
    }
}

export type AnyExternalsBuilder = ExternalsBuilder<any, any>

export type ExternalsBuilderNode = Omit<ResolvedBuilderNode, 'schema'> & {
    builder: AnyExternalsBuilder,
    schema?: $Externals
}