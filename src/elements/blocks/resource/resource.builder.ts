import type { AnyResourceJobBuilder, ResourceJobDef } from '../job/internal/resource_job.builder';
import type { ModuleTree } from '~/engine/tree';
import type { ResolvedBuilderNode} from '~/engine/dependency';
import type { JobBuildConfig} from '../job/job.builder';
import type { CreateObj, PatchResourceObj } from '~/elements/entities/bucket/bucket.types';
import type { Overlay } from '~/engine/util/type';
import type { $MessageInferFromData } from '~/elements/entities/message/message.infer';
import type { ResourceQueryRouteDef } from './resource_query.builder';

import { $Resource } from './resource.schema';
import { ResourceJobBuilder } from '../job/internal/resource_job.builder';
import { BlockBuilder } from '../block.builder';
import { NesoiError } from '~/engine/data/error';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { convertToMessage } from '~/elements/entities/bucket/model/bucket_model.convert';
import { Dependency, BuilderNode, Tag } from '~/engine/dependency';
import { NameHelpers } from '~/engine/util/name_helpers';
import { JobBuilder } from '../job/job.builder';
import { Resource } from './resource';
import { ResourceJob } from '../job/internal/resource_job';
import { ResourceQueryRouteBuilder  } from './resource_query.builder';
import type { $Space, $Module, $ResourceQueryRoutes, $Bucket, $Message, NesoiObj, $Job } from 'index';

/**
 * @category Builders
 * @subcategory Block
 */
export class ResourceBuilder<
    Space extends $Space,
    Module extends $Module,
    Resource extends $Resource,
> extends BlockBuilder<Space, Module, 'resource'> {
    public $b = 'resource' as const;

    private _jobs: { 
        query?: Dependency
        create?: Dependency
        update?: Dependency
        delete?: Dependency
    } = {};
    private _bucket!: Dependency;

    private _routes?: $ResourceQueryRoutes;

    constructor(
        module: string,
        name: Resource['name'],
    ) {
        super(module, 'resource', name);
    }

    /* [Block] */

    public auth<U extends keyof Space['users']>(
        provider: U,
        resolver?: (user: Space['users'][U]) => boolean
    ) {
        return super.auth(provider, resolver) as unknown as ResourceBuilder<
            Space, Module,
            Overlay<Resource, { '#auth': Resource['#auth'] & { [K in U]: Space['users'][U] } }>
        >;
    }

    /* Bucket */

    bucket<
        B extends keyof Module['buckets']
    >(name: B) {
        const tag = Tag.fromNameOrShort(this.module, 'bucket', name as string);
        this._bucket = new Dependency(this.module, tag, { build: true, compile: true, runtime: true });
        return this as unknown as ResourceBuilder<
            Space, Module,
            Overlay<Resource, { '#bucket': Module['buckets'][B] }>
        >;
    }

    /* Read */

    public query<
        ViewName extends keyof Resource['#bucket']['views'] & string
    >(view: ViewName, meta_def?: ResourceQueryRouteDef<Space, Module, Resource['#bucket']>) {
        const name = `${this.name}.query`;
        const alias = `Query ${this._alias || this.name}`;

        let meta;
        if (meta_def) {
            const meta_builder = new ResourceQueryRouteBuilder(view);
            meta_def(meta_builder as any);
            meta = ResourceQueryRouteBuilder.build(meta_builder);
        }

        if (this._routes) {
            this._routes[view] = meta || { view, auth: [], serialize: true };
            return this;
        }

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.tag.short,
            'query',
            alias,
            Resource.query as any,
            [...this._auth]
        )
            .input($ => ({
                view: $.string.default(view),
                query: $.dict($.any.optional).default({}),
                page: $.int.default(0),
                perPage: $.int.default(10)
            }))
            .prepare(ResourceJob.prepareMsgData);

        this._inlineNodes.push(new BuilderNode({
            tag: new Tag(this.module, 'job', name),
            builder: jobBuilder as AnyResourceJobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
        
        this._jobs.query = new Dependency(this.module, new Tag(this.module, 'job', name), { runtime: true });

        this._routes = (jobBuilder as any)._routes as ResourceJobBuilder<any, any, any, any>['_routes']
        this._routes[view] = meta || { view, auth: [], serialize: true };

        return this;
    }

    /* Create/Update/Delete */

    public create<
        MsgName extends string = `${Resource['name']}.create`,
        Bucket extends $Bucket = Resource['#bucket'],
        DefaultTrigger extends $Message = $MessageInferFromData<MsgName, Omit<Bucket['#data'], 'id'>>,
        Prepared = CreateObj<Bucket>
    >($: ResourceJobDef<Space, Module, `${Resource['name']}.create`, Prepared, Resource['#auth'], Bucket, DefaultTrigger, {}, { }, { obj: Bucket['#data'] }>) {
        const name = `${this.name}.create`;
        const alias = `Create ${this._alias || this.name}`;

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.tag.short,
            'create',
            alias,
            Resource.create as any,
            [...this._auth],
            {
                id: ['string_or_number', undefined, false]
            }
        )
            .prepare(ResourceJob.prepareMsgData);
        $(jobBuilder as any);

        this._inlineNodes.push(new BuilderNode({
            tag: new Tag(this.module, 'job', name),
            builder: jobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
        
        this._jobs.create = new Dependency(this.module, new Tag(this.module, 'job', name), { runtime: true });
        return this;
    }    

    public update<
        MsgName extends string = `${Resource['name']}.update`,
        Bucket extends $Bucket = Resource['#bucket'],
        DefaultTrigger extends $Message = $MessageInferFromData<MsgName, Bucket['#data']>,
        Prepared extends Record<string, any> = Omit<PatchResourceObj<Bucket>, 'id'>
    >($: ResourceJobDef<Space, Module, MsgName, Prepared, Resource['#auth'], Bucket, DefaultTrigger, { id: Bucket['#data']['id'] }, { obj: Bucket['#data'] }, { obj: Bucket['#data'] }>) {
        const name = `${this.name}.update`;
        const alias = `Update ${this._alias || this.name}`;

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.tag.short,
            'update',
            alias,
            Resource.update as any,
            [...this._auth],
            {
                id: ['string_or_number', undefined, true]
            }
        )
            .prepare(ResourceJob.prepareMsgData);
        $(jobBuilder as any);

        this._inlineNodes.push(new BuilderNode({
            tag: new Tag(this.module, 'job', name),
            builder: jobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));

        this._jobs.update = new Dependency(this.module, new Tag(this.module, 'job', name), { runtime: true });
        return this;
    }

    public delete<
        MsgName extends string = `${Resource['name']}.delete`,
        Data extends NesoiObj = Resource['#bucket']['#data'],
        DefaultTrigger extends $Message = $MessageInferFromData<MsgName, { id: Data['id'] }>,
    >($: ResourceJobDef<Space, Module, `${Resource['name']}.delete`, boolean, Resource['#auth'], Resource['#bucket'], DefaultTrigger, { id: Data['id'] }, { obj: Data }, { obj: Data }>) {
        const name = `${this.name}.delete`;
        const alias = `Delete ${this._alias || this.name}`;
        
        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.tag.short,
            'delete',
            alias,
            Resource.delete as any,
            [...this._auth],
            {
                id: ['string_or_number', undefined, true]
            }
        )
            .prepare(ResourceJob.prepareTrue);
        $(jobBuilder as any);

        this._inlineNodes.push(new BuilderNode({
            tag: new Tag(this.module, 'job', name),
            builder: jobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));

        this._jobs.delete = new Dependency(this.module, new Tag(this.module, 'job', name), { runtime: true });
        return this;
    }

    // Build

    public static build(node: ResourceBuilderNode, tree: ModuleTree, module: $Module) {
        const bucket = Tag.resolve(node.builder._bucket.tag, tree) as $Bucket;
        if (!bucket) {
            throw NesoiError.Builder.Resource.BucketNotFound(node.builder.name, node.builder._bucket.tag.short);
        }
        const model = bucket.model;

        const modelName = NameHelpers.nameLowToHigh(bucket.name);
        const inlineMsgs: Record<string, $Message> = {};
        const inlineJobs: Record<string, $Job> = {};

        const inlineJobsConfig: JobBuildConfig = {}

        // query
        const queryDep = node.builder._jobs.query;
        if (queryDep) {
            inlineJobsConfig[queryDep.tag.name] = {
                ResourceJob: {
                    idType: null,
                    output: { raw: modelName + '[]' },
                    defaultTrigger: undefined as any
                }
            };
        }

        // create
        const createDep = node.builder._jobs.create;
        if (createDep) {
            const defaultTrigger = convertToMessage(
                module.name,
                model,
                createDep.tag.name,
                `Create ${node.builder._alias || node.builder.name}`,
                [],
                [],
                ['id']
            );
            inlineJobsConfig[createDep.tag.name] = {
                ResourceJob: {
                    idType: undefined,
                    output: { raw: modelName },
                    defaultTrigger
                }
            };
        }

        // update
        const updateDep = node.builder._jobs.update;
        if (updateDep) {
            const defaultTrigger = convertToMessage(
                module.name,
                model,
                updateDep.tag.name,
                `Update ${node.builder._alias || node.builder.name}`,
                [],
                []
            );
            inlineJobsConfig[updateDep.tag.name] = {
                ResourceJob: {
                    idType: model.fields.id.type as 'int' | 'string',
                    output: { raw: modelName },
                    defaultTrigger
                }
            };
        }
        
        // delete
        const deleteDep = node.builder._jobs.delete;
        if (deleteDep) {
            const defaultTrigger = convertToMessage(
                module.name,
                model,
                deleteDep.tag.name,
                `Delete ${node.builder._alias || node.builder.name}`,
                ['id'],
                []
            );
            inlineJobsConfig[deleteDep.tag.name] = {
                ResourceJob: {
                    idType: model.fields.id.type as 'int' | 'string',
                    output: { raw: 'void' },
                    defaultTrigger
                }
            };
        }

        node.schema = new $Resource(
            node.builder.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._auth,
            node.builder._bucket.tag,
            {
                query: node.builder._jobs.query?.tag,
                create: node.builder._jobs.create?.tag,
                update: node.builder._jobs.update?.tag,
                delete: node.builder._jobs.delete?.tag,
            }
        );

        const jobs = JobBuilder.buildInlines(node, tree, module, inlineJobsConfig);

        return {
            schema: node.schema,
            inlineMessages: {
                ...MessageBuilder.buildInlines(node, tree, module),
                ...jobs.nestedInlineMessages,
                ...inlineMsgs,
            },
            inlineJobs: {
                ...jobs.inlineJobs,
                ...inlineJobs
            }
        };
    }

}

export type AnyResourceBuilder = ResourceBuilder<any, any, any>

export type ResourceBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyResourceBuilder,
    schema?: $Resource
}