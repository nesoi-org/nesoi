import * as fs from 'fs';
import * as path from 'path';

import { $Module, $Space } from '~/schema';
import { Log, scopeTag } from './util/log';
import { Machine } from '~/elements/blocks/machine/machine';

import { AnyMessageBuilder, MessageBuilder, MessageBuilderNode } from '~/elements/entities/message/message.builder';
import { AnyBucketBuilder, BucketBuilder, BucketBuilderNode } from '~/elements/entities/bucket/bucket.builder';
import { AnyResourceBuilder, ResourceBuilder, ResourceBuilderNode } from '~/elements/blocks/resource/resource.builder';
import { AnyMachineBuilder, MachineBuilder, MachineBuilderNode } from '~/elements/blocks/machine/machine.builder';
import { Job } from '~/elements/blocks/job/job';
import { AnyJobBuilder, JobBuilder, JobBuilderNode } from '~/elements/blocks/job/job.builder';
import { MessageParser } from '~/elements/entities/message/message_parser';
import { $Message } from '~/elements/entities/message/message.schema';
import { Resource } from '~/elements/blocks/resource/resource';
import { Queue } from '~/elements/blocks/queue/queue';
import { Controller } from '~/elements/edge/controller/controller';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { $Constants } from '~/elements/entities/constants/constants.schema';
import { ConstantsBuilder, ConstantsBuilderNode } from '~/elements/entities/constants/constants.builder';
import { AnyControllerBuilder, ControllerBuilder, ControllerBuilderNode } from '~/elements/edge/controller/controller.builder';
import { AnyExternalsBuilder, ExternalsBuilder, ExternalsBuilderNode } from '~/elements/blocks/externals/externals.builder';
import { NesoiError } from './data/error';
import { $Externals } from '~/elements/blocks/externals/externals.schema';
import { $Dependency, ResolvedBuilderNode } from './dependency';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
import { $Machine } from '~/elements/blocks/machine/machine.schema';
import { $Controller } from '~/elements/edge/controller/controller.schema';
import { $Job } from '~/elements/blocks/job/job.schema';
import { ModuleTree } from './tree';
import { AnyResourceJobBuilder } from '~/elements/blocks/job/internal/resource_job.builder';
import { AnyApp, App } from './apps/app';
import { AnyMachineJobBuilder } from '~/elements/blocks/job/internal/machine_job.builder';
import { AnyQueueBuilder, QueueBuilder, QueueBuilderNode } from '~/elements/blocks/queue/queue.builder';
import { $Queue } from '~/elements/blocks/queue/queue.schema';
import { NQL_Engine } from '~/elements/entities/bucket/query/nql_engine';
import { AnyDaemon, Daemon } from './daemon';

export type AnyBuilder = 
    AnyExternalsBuilder |
    ConstantsBuilder |
    AnyMessageBuilder |
    AnyBucketBuilder |
    AnyJobBuilder |
    AnyResourceJobBuilder |
    AnyMachineJobBuilder |
    AnyResourceBuilder |
    AnyMachineBuilder |
    AnyControllerBuilder |
    AnyQueueBuilder

export type AnyElementSchema = 
    $Externals |
    $Constants |
    $Message |
    $Bucket |
    $Job |
    $Resource |
    $Machine |
    $Controller |
    $Queue

export type AnyInlineElementSchema = 
    $Message |
    $Job


export type VirtualModuleDef = {
    name: string
    schemas?: {
        messages?: $Message[],
        machines?: $Machine[]
    }
    externals?: {
        messages?: $Dependency[],
        buckets?: $Dependency[],
        jobs?: $Dependency[]
    }
}

export class Module<
    S extends $Space,
    $ extends $Module
> {
    // Schemas built by this module
    schema = {
        constants: new $Constants(this.name),
        externals: new $Externals(this.name),
        buckets: {},
        messages: {},
        jobs: {},
        resources: {},
        machines: {},
        controllers: {},
        queues: {},
    } as $;

    /* Entities */

    public buckets = {} as {
        [B in keyof $['buckets']]: Bucket<$, $['buckets'][B]>
    };
    public messages = {} as {
        [B in keyof $['messages']]: MessageParser<$['messages'][B]>
    };

    /* Blocks */

    public jobs = {} as {
        [B in keyof $['jobs']]: Job<S, $, $['jobs'][B]>
    };
    public resources = {} as {
        [B in keyof $['resources']]: Resource<S, $, $['resources'][B]>
    };
    public machines = {} as {
        [B in keyof $['machines']]: Machine<S, $, $['machines'][B]>
    };
    public queues = {} as {
        [B in keyof $['queues']]: Queue<$, $['queues'][B]>
    };

    /* Edge */

    public controllers = {} as {
        [B in keyof $['controllers']]: Controller<S, $, $['controllers'][B]>
    };

    /* Daemon */
    // When the module is run by a daemon, it sets this reference to itself.
    public daemon?: AnyDaemon
    
    /* NQL */
    // The NQL engine for this module
    public nql!: NQL_Engine;
    
    public boot?: {
        path: string
    } | {
        builders: AnyBuilder[]
    };

    constructor(
        public name: string,
        boot?: {
            path: string
        } | {
            builders: AnyBuilder[]
        }
    ) {
        this.schema.name = name;
        this.boot = boot;
    }

    info() {
        Log.info('module', this.name, 'Loaded', {
            values: Object.keys(this.schema.constants.values),
            enums: Object.keys(this.schema.constants.enums),
            messages: Object.keys(this.messages),
            buckets: Object.keys(this.buckets),
            jobs: Object.keys(this.jobs),
            resources: Object.keys(this.resources),
            machines: Object.keys(this.machines),
            controllers: Object.keys(this.controllers),
            queues: Object.keys(this.queues),
        });
    }

    // Manual injection

    public inject(schemas: {
        constants?: $Constants,
        externals?: $Externals,
        buckets?: $Bucket[],
        messages?: $Message[],
        jobs?: $Job[],
        resources?: $Resource[],
        machines?: $Machine[],
        queues?: $Queue[],
        controllers?: $Controller[],
    }) {
        if (schemas.constants) {
            $Constants.merge(this.schema.constants, schemas.constants);
        }
        if (schemas.externals) {
            $Externals.merge(this.schema.externals, schemas.externals);
        }
        schemas.buckets?.forEach(schema => {
            this.schema.buckets[schema.name] = schema;
        })
        schemas.messages?.forEach(schema => {
            this.schema.messages[schema.name] = schema;
        })
        schemas.jobs?.forEach(schema => {
            this.schema.jobs[schema.name] = schema;
        })
        schemas.resources?.forEach(schema => {
            this.schema.resources[schema.name] = schema;
        })
        schemas.machines?.forEach(schema => {
            this.schema.machines[schema.name] = schema;
        })
        schemas.queues?.forEach(schema => {
            this.schema.queues[schema.name] = schema;
        })
        schemas.controllers?.forEach(schema => {
            this.schema.controllers[schema.name] = schema;
        })
        return this;
    }

    public injectDependencies(daemon: AnyDaemon, dependencies: {
        buckets?: $Dependency[],
        jobs?: $Dependency[],
        messages?: $Dependency[],
        machines?: $Dependency[]
    }) {
        dependencies.buckets?.forEach(dep => {
            const bucketModule = Daemon.getModule(daemon, dep.module);
            const bucket = bucketModule.buckets[dep.name];
            if (!bucket) {
                throw new Error(`Internal Error: unable to find bucket '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.buckets as any)[dep.refName] = bucket;
        })
        dependencies.jobs?.forEach(dep => {
            const jobModule = Daemon.getModule(daemon, dep.module);
            const job = jobModule.jobs[dep.name];
            if (!job) {
                throw new Error(`Internal Error: unable to find job '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.jobs as any)[dep.refName] = job;
        })
        dependencies.messages?.forEach(dep => {
            const messageModule = Daemon.getModule(daemon, dep.module);
            const message = messageModule.messages[dep.name];
            if (!message) {
                throw new Error(`Internal Error: unable to find message '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.messages as any)[dep.refName] = message;
        })
        dependencies.machines?.forEach(dep => {
            const machineModule = Daemon.getModule(daemon, dep.module);
            const machine = machineModule.machines[dep.name];
            if (!machine) {
                throw new Error(`Internal Error: unable to find machine '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.machines as any)[dep.refName] = machine;
        })
        return this;
    }

    // Treeshaking

    public scanFiles(dir: string, exclude: string[] = []) {
        const files: string[] = [];
        fs.readdirSync(dir, { withFileTypes: true })
            .forEach(node => {
                const nodePath = path.resolve(dir, node.name);
                                
                // TODO: Wildcards, this is just ugly
                for (const path of exclude) {
                    if (nodePath.endsWith(path.slice(1))) {
                        return;
                    }
                }
                
                if (node.isDirectory()) {
                    const childFiles = this.scanFiles(nodePath, exclude);
                    files.push(...childFiles);
                }
                else {
                    if (!nodePath.endsWith('.ts')) {
                        return;
                    }
                    files.push(nodePath);
                }
            });
        return files;
    }

    // Build Nodes
    
    async buildNode(node: ResolvedBuilderNode, tree: ModuleTree) {
        Log.trace('compiler', 'module', `Building ${this.name}::${scopeTag(node.builder.$b as any,(node.builder as any).name)}`);
        
        if (node.builder.$b === 'constants') {
            this.schema.constants = ConstantsBuilder.build(node as ConstantsBuilderNode);
        }
        else if (node.builder.$b === 'externals') {
            this.schema.externals = ExternalsBuilder.build(node as ExternalsBuilderNode);
        }
        else if (node.builder.$b === 'bucket') {
            this.schema.buckets[node.name] = BucketBuilder.build(node as BucketBuilderNode, tree);
        }
        else if (node.builder.$b === 'message') {
            this.schema.messages[node.name] = MessageBuilder.build(node as MessageBuilderNode, tree,this.schema);
        }
        else if (node.builder.$b === 'job') {
            const { schema, inlineMessages } = JobBuilder.build(node as JobBuilderNode, tree, this.schema);
            this.schema.jobs[node.name] = schema;
            this.mergeInlineMessages(node, inlineMessages);
        }
        else if (node.builder.$b === 'resource') {
            const { schema, inlineMessages, inlineJobs } = ResourceBuilder.build(node as ResourceBuilderNode, tree, this.schema);
            this.schema.resources[schema.name] = schema;
            this.mergeInlineMessages(node, inlineMessages);
            this.mergeInlineJobs(node, inlineJobs);
        }
        else if (node.builder.$b === 'machine') {
            const { schema, inlineMessages, inlineJobs } = MachineBuilder.build(node as MachineBuilderNode, tree, this.schema);
            this.schema.machines[schema.name] = schema;
            this.mergeInlineMessages(node, inlineMessages);
            this.mergeInlineJobs(node, inlineJobs);
        }
        else if (node.builder.$b === 'controller') {
            this.schema.controllers[node.name] = ControllerBuilder.build(node as ControllerBuilderNode);
        }
        else if (node.builder.$b === 'queue') {
            const { schema, inlineMessages } = QueueBuilder.build(node as QueueBuilderNode, tree, this.schema);
            this.schema.queues[node.name] = schema;
            this.mergeInlineMessages(node, inlineMessages);
        }
        else {
            throw NesoiError.Module.UnknownBuilderType(this, node.filepath.toString(), node.name, (node.builder as any).$b);
        }
    }

    private mergeInlineMessages(node: ResolvedBuilderNode, schemas: Record<string, $Message>) {
        for (const name in schemas) {
            const $msg = schemas[name];
            this.schema.messages[name] = $msg;
        }
    }

    private mergeInlineJobs(node: ResolvedBuilderNode, schemas: Record<string, $Job>) {
        for (const name in schemas) {
            const $job = schemas[name];
            this.schema.jobs[name] = $job;
        }
    }

    // Start

    public start(app: AnyApp, providers: Record<string, any>) {
        const info = App.getInfo(app);
        const config = info.config;

        Object.entries(this.schema.buckets).forEach(([name, schema]) => {
            const bucketConfig = config.buckets?.[this.name]?.[name];
            (this.buckets as any)[name] = new Bucket(schema, bucketConfig, providers);
        })

        Object.entries(this.schema.messages).forEach(([name, schema]) => {
            (this.messages as any)[name] = new MessageParser(schema);
        })

        Object.entries(this.schema.jobs).forEach(([name, schema]) => {
            (this.jobs as any)[name] = new Job(this, schema);
        })

        Object.entries(this.schema.resources).forEach(([name, schema]) => {
            (this.resources as any)[name] = new Resource(this, schema);
        })

        Object.entries(this.schema.machines).forEach(([name, schema]) => {
            (this.machines as any)[name] = new Machine(this, schema);
        })

        Object.entries(this.schema.controllers).forEach(([name, schema]) => {
            const controllerConfig = config.controllers?.[this.name]?.[name];
            (this.controllers as any)[name] = new Controller(this, schema, controllerConfig, providers);
        })

        Object.entries(this.schema.queues).forEach(([name, schema]) => {
            (this.queues as any)[name] = new Queue(this, schema);
        })

        this.nql = new NQL_Engine(this);
    }


    // Destroy

    destroy() {
        // Destroy messages
        for (const name in this.messages || []) {
            this.destroyBlock('message', name);
        }

        // Destroy buckets
        for (const name in this.buckets || {}) {
            this.destroyBlock('bucket', name);
        }

        // Destroy jobs
        for (const name in this.jobs || []) {
            this.destroyBlock('job', name);
        }

        // Destroy resources
        for (const name in this.resources || []) {
            this.destroyBlock('resource', name);
        }

        // Destroy machines
        for (const name in this.machines || []) {
            this.destroyBlock('machine', name);
        }

        // Destroy queues
        for (const name in this.queues || []) {
            this.destroyBlock('queue', name);
        }

        // Destroy controllers
        for (const name in this.controllers || []) {
            this.destroyBlock('controller', name);
        }
    }

    private async destroyBlock(
        type: 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue',
        name: string
    ) {
        const t = type + 's' as `${typeof type}s`;
        Log.info('module', this.name, 'Destroying');
        delete (this.schema[t] as any)[name];
        delete (this[t] as any)[name];
    }

    // Virtual

    public static async virtual(daemon: AnyDaemon, def: VirtualModuleDef) {

        const virtualModule = new Module(def.name, { builders: [] });

        // Inject schemas
        if (def.schemas) {
            virtualModule.inject(def.schemas)
        }

        // Build schemas
        await virtualModule.start({ config: {} } as any, {})
        
        // Inject externals
        if (def.externals) {
            virtualModule.injectDependencies(daemon!, def.externals)
        }
        
        return virtualModule;        
    }
}

export type AnyModule = Module<any, any>