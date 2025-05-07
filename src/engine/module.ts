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
import { AnyExternalsBuilder, ExternalsBuilder, ExternalsBuilderNode } from '~/elements/edge/externals/externals.builder';
import { NesoiError } from './data/error';
import { $Externals } from '~/elements/edge/externals/externals.schema';
import { $Dependency, ResolvedBuilderNode } from './dependency';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
import { $Machine } from '~/elements/blocks/machine/machine.schema';
import { $Controller } from '~/elements/edge/controller/controller.schema';
import { $Job } from '~/elements/blocks/job/job.schema';
import { ModuleTree } from './tree';
import { AnyResourceJobBuilder } from '~/elements/blocks/job/internal/resource_job.builder';
import { AnyApp, App } from './apps/app';
import { AnyService } from './apps/service';
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

/**
 * A `Module` is an isolated named collection of _Elements_.
 * 
 * Modules should be designed to work in isolation as much as possible.
 * When declaring external dependencies, these can be injected into the
 * module or linked externally through REST or other means.
 * 
 * Each `Module` has a _Transaction Engine_, which keeps track of
 * transactions performed with the Module elements.
 * Transactions can be shared between engines, to allow for a tracking
 * of distributed applications.
 * 
 * @category Engine
 */
export class Module<
    S extends $Space,
    $ extends $Module
> {
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
    /**
     * Daemon which is running the current module.
     * This is `undefined` when the _Module_ is created for compiling.
     */
    public daemon?: AnyDaemon
    
    /**
     * NQL (Nesoi Query Language) Engine for this module.
     */
    public nql!: NQL_Engine;
    
    /**
     * The boot source for this module:
     * - `dirpath`: This module is being run from a Space (Framework mode), so
     * source is the module directory, from which builders will be read
     * - `builders`: This module is being run in Library mode, so source is
     * a list of builders
     */
    public boot?: {
        dirpath: string
    } | {
        builders: AnyBuilder[]
    };

    /**
     * @param name A module name
     * @param boot The boot source for this module
     */
    constructor(
        public name: string,
        boot?: {
            dirpath: string
        } | {
            builders: AnyBuilder[]
        }
    ) {
        this.schema.name = name;
        this.boot = boot;
    }

    /**
     * Log the module elements
     */
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

    /**
     * Inject element schemas into the module.
     * This is used on the compiled version of the `App`, which has
     * the schemas pre-built, so it directly injects them.
     * 
     * @param schemas A dictionary of schema(s) by element type
     * @returns The `Module`, for call-chaining
     */
    public inject(schemas: {
        externals?: $Externals,
        constants?: $Constants,
        buckets?: $Bucket[],
        messages?: $Message[],
        jobs?: $Job[],
        resources?: $Resource[],
        machines?: $Machine[],
        queues?: $Queue[],
        controllers?: $Controller[],
    }) {
        if (schemas.externals) {
            $Externals.merge(this.schema.externals, schemas.externals);
        }
        if (schemas.constants) {
            $Constants.merge(this.schema.constants, schemas.constants);
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

    /**
     * Include references for external elements on the module.
     * This allows a module to use elements from other modules directly,
     * on single-threaded `Apps`.
     * This implementation also includes transitive dependencies.
     * 
     * @param daemon A `Daemon` instance
     * @param dependencies: A dictionary of dependencies by element type
     * @returns The `Module`, for call-chaining
     */
    public injectDependencies(modules: Record<string, AnyModule>, dependencies: {
        buckets?: $Dependency[],
        jobs?: $Dependency[],
        messages?: $Dependency[],
        machines?: $Dependency[]
    }) {
        dependencies.buckets?.forEach(dep => {
            const bucketModule = modules[dep.module];
            const bucket = bucketModule.buckets[dep.name];
            if (!bucket) {
                throw new Error(`Internal Error: unable to find bucket '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.buckets as any)[dep.refName] = bucket;
        })
        dependencies.jobs?.forEach(dep => {
            const jobModule = modules[dep.module];
            const job = jobModule.jobs[dep.name];
            if (!job) {
                throw new Error(`Internal Error: unable to find job '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.jobs as any)[dep.refName] = job;
            const schema = job.schema as $Job;
            this.injectDependencies(modules, {
                messages: schema.input
            })
        })
        dependencies.messages?.forEach(dep => {
            const messageModule = modules[dep.module];
            const message = messageModule.messages[dep.name];
            if (!message) {
                throw new Error(`Internal Error: unable to find message '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.messages as any)[dep.refName] = message;
        })
        dependencies.machines?.forEach(dep => {
            const machineModule = modules[dep.module];
            const machine = machineModule.machines[dep.name];
            if (!machine) {
                throw new Error(`Internal Error: unable to find machine '${dep.tag}' during injection to module '${this.name}'`)
            }
            (this.machines as any)[dep.refName] = machine;
            const schema = machine.schema as $Machine;
            this.injectDependencies(modules, {
                messages: schema.input,
                buckets: schema.buckets,
                jobs: schema.jobs
            })
        })
        return this;
    }

    // Treeshaking

    /**
     * Recursively find all files inside the module dir.
     * 
     * @param dirpath A directory to scan
     * @param exclude: A list of patterns to ignore
     * @returns A list of file paths
     */
    public scanFiles(dirpath: string, exclude: string[] = []) {
        const files: string[] = [];
        fs.readdirSync(dirpath, { withFileTypes: true })
            .forEach(node => {
                const nodePath = path.resolve(dirpath, node.name);
                                
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
    
    /**
     * Build a resolved builder node, then merge the 
     * resulting schema(s) to the module.
     * This also merges the resulting inline nodes of building a node.
     * 
     * @param node A resolved builder node
     * @param tree A module tree
     */
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
            this.mergeInlineMessages(inlineMessages);
        }
        else if (node.builder.$b === 'resource') {
            const { schema, inlineMessages, inlineJobs } = ResourceBuilder.build(node as ResourceBuilderNode, tree, this.schema);
            this.schema.resources[schema.name] = schema;
            this.mergeInlineMessages(inlineMessages);
            this.mergeInlineJobs(inlineJobs);
        }
        else if (node.builder.$b === 'machine') {
            const { schema, inlineMessages, inlineJobs } = MachineBuilder.build(node as MachineBuilderNode, tree, this.schema);
            this.schema.machines[schema.name] = schema;
            this.mergeInlineMessages(inlineMessages);
            this.mergeInlineJobs(inlineJobs);
        }
        else if (node.builder.$b === 'controller') {
            this.schema.controllers[node.name] = ControllerBuilder.build(node as ControllerBuilderNode);
        }
        else if (node.builder.$b === 'queue') {
            const { schema, inlineMessages } = QueueBuilder.build(node as QueueBuilderNode, tree, this.schema);
            this.schema.queues[node.name] = schema;
            this.mergeInlineMessages(inlineMessages);
        }
        else {
            throw NesoiError.Module.UnknownBuilderType(this, node.filepath.toString(), node.name, (node.builder as any).$b);
        }
    }

    /**
     * Merge inline message schemas into the module.
     * 
     * @param node A resolved builder node
     * @param schemas A dictionary of Message schemas by name
     */
    private mergeInlineMessages(schemas: Record<string, $Message>) {
        for (const name in schemas) {
            const $msg = schemas[name];
            this.schema.messages[name] = $msg;
        }
    }

    /**
     * Merge inline job schemas into the module.
     * 
     * @param node A resolved builder node
     * @param schemas A dictionary of job schemas by name
     */
    private mergeInlineJobs(schemas: Record<string, $Job>) {
        for (const name in schemas) {
            const $job = schemas[name];
            this.schema.jobs[name] = $job;
        }
    }

    // Start

    /**
     * Create elements from schemas, and the NQL engine for this module.
     * 
     * @param app A `App` instance
     * @param services A dictionary of services by name
     */
    public start(app: AnyApp, services: Record<string, AnyService>) {
        const info = App.getInfo(app);
        const config = info.config;

        Object.entries(this.schema.buckets).forEach(([name, schema]) => {
            const bucketConfig = config.buckets?.[this.name]?.[name];
            (this.buckets as any)[name] = new Bucket(schema, bucketConfig, services);
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
            (this.controllers as any)[name] = new Controller(this, schema, controllerConfig, services);
        })

        Object.entries(this.schema.queues).forEach(([name, schema]) => {
            (this.queues as any)[name] = new Queue(this, schema);
        })

        this.nql = new NQL_Engine(this);
    }


    // Destroy

    /**
     * Destroy all elements from module.
     */
    destroy() {
        // Destroy messages
        for (const name in this.messages || []) {
            this.destroyElement('message', name);
        }

        // Destroy buckets
        for (const name in this.buckets || {}) {
            this.destroyElement('bucket', name);
        }

        // Destroy jobs
        for (const name in this.jobs || []) {
            this.destroyElement('job', name);
        }

        // Destroy resources
        for (const name in this.resources || []) {
            this.destroyElement('resource', name);
        }

        // Destroy machines
        for (const name in this.machines || []) {
            this.destroyElement('machine', name);
        }

        // Destroy queues
        for (const name in this.queues || []) {
            this.destroyElement('queue', name);
        }

        // Destroy controllers
        for (const name in this.controllers || []) {
            this.destroyElement('controller', name);
        }
    }

    /**
     * Destroy one element from module.
     */
    private async destroyElement(
        type: 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue',
        name: string
    ) {
        const t = type + 's' as `${typeof type}s`;
        Log.info('module', this.name, 'Destroying');
        delete (this.schema[t] as any)[name];
        delete (this[t] as any)[name];
    }

    // Virtual

    /**
     * Create a virtual module from a definition.
     * A virtual module can be used to dynamically create
     * and use schemas with limited access to the application elements.
     * 
     * @param daemon A `Daemon` instance
     * @param def A definition for a Virtual Module
     * @returns A `Module` instance
     */
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
            const modules: Record<string, AnyModule> = {}
            Daemon.getModules(daemon).forEach(module => {
                modules[module.name] = module;
            })
            virtualModule.injectDependencies(modules, def.externals)
        }
        
        return virtualModule;        
    }
}

export type AnyModule = Module<any, any>