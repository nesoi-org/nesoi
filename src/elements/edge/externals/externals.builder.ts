import { $Space } from '~/schema';
import { $Externals } from './externals.schema';
import { $Dependency, ResolvedBuilderNode } from '~/engine/dependency';
import { MergeUnion } from '~/engine/util/type';

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
    `${M & string}::${string}` | `${string}::${string}::${string}`
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

    private buckets: Record<string, $Dependency> = {};
    private messages: Record<string, $Dependency> = {};
    private jobs: Record<string, $Dependency> = {};
    private machines: Record<string, $Dependency> = {};
    private enums: Record<string, $Dependency> = {};

    constructor(
        private module: string
    ) {}

    bucket<
        M extends keyof Space['modules'],
        B extends ExternalBucketRefName<Space, ModuleName>
    >(ref: B) {
        this.buckets[ref] = new $Dependency(this.module, 'bucket', ref);
        return this;
    }
    
    message<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['messages']
    >(ref: `${M & string}::${B & string}`) {
        this.messages[ref] = new $Dependency(this.module, 'message', ref);
        return this;
    }

    job<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['jobs']
    >(ref: `${M & string}::${B & string}`) {
        this.jobs[ref] = new $Dependency(this.module, 'job', ref);
        return this;
    }

    machine<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['machines']
    >(ref: `${M & string}::${B & string}`) {
        this.machines[ref] = new $Dependency(this.module, 'machine', ref);
        return this;
    }

    enum<
        M extends Exclude<keyof Space['modules'], ModuleName>,
        B extends keyof Space['modules'][M]['constants']['enums']
    >(ref: `${M & string}::${B & string}`) {
        this.enums[ref] = new $Dependency(this.module, 'enum' as any, ref);
        return this;
    }

    public static merge(to: AnyExternalsBuilder, from: AnyExternalsBuilder) {
        Object.assign(to.buckets, from.buckets);
        Object.assign(to.jobs, from.jobs);
    }

    // Build
    
    public static build(node: ExternalsBuilderNode) {
        node.schema = new $Externals(
            node.module,
            node.builder.buckets,
            node.builder.messages,
            node.builder.jobs,
            node.builder.machines,
            node.builder.enums
        );
        return node.schema;
    }
}

export type AnyExternalsBuilder = ExternalsBuilder<any, any>

export type ExternalsBuilderNode = ResolvedBuilderNode & {
    builder: AnyExternalsBuilder,
    schema?: $Externals
}