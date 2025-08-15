import { $Module, $Space } from '~/schema';
import { $Resource } from './resource.schema';
import { AnyResourceJobBuilder, ResourceJobBuilder, ResourceJobDef } from '../job/internal/resource_job.builder';
import { NesoiObj } from '~/engine/data/obj';
import { $Message } from '~/elements/entities/message/message.schema';
import { BlockBuilder } from '../block.builder';
import { NesoiError } from '~/engine/data/error';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { ModuleTree } from '~/engine/tree';
import { convertToMessage } from '~/elements/entities/bucket/model/bucket_model.convert';
import { $Job } from '../job/job.schema';
import { $Dependency, BuilderNode, ResolvedBuilderNode } from '~/engine/dependency';
import { NameHelpers } from '~/engine/util/name_helpers';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { JobBuildConfig, JobBuilder } from '../job/job.builder';
import { CreateObj, PatchResourceObj } from '~/elements/entities/bucket/bucket.types';
import { Resource } from './resource';
import { Overlay } from '~/engine/util/type';
import { $MessageInferFromData } from '~/elements/entities/message/message.infer';
import { ResourceJob } from '../job/internal/resource_job';

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
        view?: $Dependency
        query?: $Dependency
        create?: $Dependency
        update?: $Dependency
        delete?: $Dependency
    } = {};
    private _bucket!: $Dependency;

    constructor(
        module: string,
        name: Resource['name'],
    ) {
        super(module, 'resource', name);
    }

    /* [Block] */

    public authn<
        U extends keyof Space['authnUsers']
    >(...providers: U[]) {
        return super.authn(...providers as string[]) as unknown as ResourceBuilder<
            Space, Module,
            Overlay<Resource, { '#authn': { [K in U]: Space['authnUsers'][U] } }>
        >;
    }

    /* Bucket */

    bucket<
        B extends keyof Module['buckets']
    >(name: B) {
        this._bucket = new $Dependency(this.module, 'bucket', name as string);
        return this as unknown as ResourceBuilder<
            Space, Module,
            Overlay<Resource, { '#bucket': Module['buckets'][B] }>
        >;
    }

    /* Read */

    public view<
        ViewName extends keyof Resource['#bucket']['views'] & string
    >(...views: ViewName[]) {
        const name = `${this.name}.view`;
        const alias = `View ${this._alias || this.name}`;

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.refName,
            'view',
            alias,
            Resource.view as any,
            this._authn
        )
            .input($ => ({
                view: $.enum(views).default(views[0]),
                id: $.string_or_number.optional,
                perPage: $.int.default(10),
                page: $.int.default(0),
                orderBy: $.string.optional,
                orderDesc: $.boolean.default(false)
            }))
            .prepare(ResourceJob.prepareMsgData);

        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'job',
            name: name,
            builder: jobBuilder as AnyResourceJobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
        
        this._jobs.view = new $Dependency(this.module, 'job', name);
        return this;
    }

    public query<
        ViewName extends keyof Resource['#bucket']['views'] & string
    >(...views: ViewName[]) {
        const name = `${this.name}.query`;
        const alias = `Query ${this._alias || this.name}`;

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.refName,
            'query',
            alias,
            Resource.query as any,
            this._authn
        )
            .input($ => ({
                view: $.enum(views).default(views[0]),
                query: $.dict($.any.optional).default({}),
                page: $.int.default(0),
                perPage: $.int.default(10)
            }))
            .prepare(ResourceJob.prepareMsgData);

        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'job',
            name: name,
            builder: jobBuilder as AnyResourceJobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
        
        this._jobs.query = new $Dependency(this.module, 'job', name);
        return this;
    }

    /* Create/Update/Delete */

    public create<
        MsgName extends string = `${Resource['name']}.create`,
        Bucket extends $Bucket = Resource['#bucket'],
        DefaultTrigger extends $Message = $MessageInferFromData<MsgName, Omit<Bucket['#data'], 'id'>>,
        Prepared = CreateObj<Bucket>
    >($: ResourceJobDef<Space, Module, `${Resource['name']}.create`, Prepared, Resource['#authn'], Bucket, DefaultTrigger, {}, { }, { obj: Bucket['#data'] }>) {
        const name = `${this.name}.create`;
        const alias = `Create ${this._alias || this.name}`;

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.refName,
            'create',
            alias,
            Resource.create as any,
            this._authn,
            {
                id: ['string_or_number', undefined, false]
            }
        )
            .prepare(ResourceJob.prepareMsgData);
        $(jobBuilder as any);

        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'job',
            name: name,
            builder: jobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
        
        this._jobs.create = new $Dependency(this.module, 'job', name);
        return this;
    }    

    public update<
        MsgName extends string = `${Resource['name']}.update`,
        Bucket extends $Bucket = Resource['#bucket'],
        DefaultTrigger extends $Message = $MessageInferFromData<MsgName, Bucket['#data']>,
        Prepared extends Record<string, any> = Omit<PatchResourceObj<Bucket>, 'id'>
    >($: ResourceJobDef<Space, Module, MsgName, Prepared, Resource['#authn'], Bucket, DefaultTrigger, { id: Bucket['#data']['id'] }, { obj: Bucket['#data'] }, { obj: Bucket['#data'] }>) {
        const name = `${this.name}.update`;
        const alias = `Update ${this._alias || this.name}`;

        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.refName,
            'update',
            alias,
            Resource.update as any,
            this._authn,
            {
                id: ['string_or_number', undefined, true]
            }
        )
            .prepare(ResourceJob.prepareMsgData);
        $(jobBuilder as any);

        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'job',
            name: name,
            builder: jobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));

        this._jobs.update = new $Dependency(this.module, 'job', name);
        return this;
    }

    public delete<
        MsgName extends string = `${Resource['name']}.delete`,
        Data extends NesoiObj = Resource['#bucket']['#data'],
        DefaultTrigger extends $Message = $MessageInferFromData<MsgName, { id: Data['id'] }>,
    >($: ResourceJobDef<Space, Module, `${Resource['name']}.delete`, boolean, Resource['#authn'], Resource['#bucket'], DefaultTrigger, { id: Data['id'] }, { obj: Data }, { obj: Data }>) {
        const name = `${this.name}.delete`;
        const alias = `Delete ${this._alias || this.name}`;
        
        const jobBuilder = new ResourceJobBuilder(
            this.module,
            name,
            this._bucket.refName,
            'delete',
            alias,
            Resource.delete as any,
            this._authn,
            {
                id: ['string_or_number', undefined, true]
            }
        )
            .prepare(ResourceJob.prepareTrue);
        $(jobBuilder as any);

        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'job',
            name: name,
            builder: jobBuilder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));

        this._jobs.delete = new $Dependency(this.module, 'job', name);
        return this;
    }

    // Build

    public static build(node: ResourceBuilderNode, tree: ModuleTree, module: $Module) {
        const bucket = tree.getSchema(node.builder._bucket) as $Bucket;
        if (!bucket) {
            throw NesoiError.Builder.Resource.BucketNotFound(node.builder.name, node.builder._bucket.refName);
        }
        const model = bucket.model;

        const modelName = NameHelpers.nameLowToHigh(bucket.name);
        const inlineMsgs: Record<string, $Message> = {};
        const inlineJobs: Record<string, $Job> = {};

        const inlineJobsConfig: JobBuildConfig = {}

        // view
        const viewDep = node.builder._jobs.view;
        if (viewDep) {
            inlineJobsConfig[viewDep.name] = {
                ResourceJob: {
                    output: { raw: modelName + ' | ' + modelName + '[]' },
                    defaultTrigger: undefined as any
                }
            };
        }

        // query
        const queryDep = node.builder._jobs.query;
        if (queryDep) {
            inlineJobsConfig[queryDep.name] = {
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
                createDep.name,
                `Create ${node.builder._alias || node.builder.name}`,
                [],
                [],
                ['id']
            );
            inlineJobsConfig[createDep.name] = {
                ResourceJob: {
                    idType: null,
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
                updateDep.name,
                `Update ${node.builder._alias || node.builder.name}`,
                [],
                []
            );
            inlineJobsConfig[updateDep.name] = {
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
                deleteDep.name,
                `Delete ${node.builder._alias || node.builder.name}`,
                ['id'],
                []
            );
            inlineJobsConfig[deleteDep.name] = {
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
            node.builder._authn,
            node.builder._bucket,
            node.builder._jobs
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