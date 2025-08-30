import * as fs from 'fs';
import * as path from 'path';

import { $Module, $Space } from '~/schema';
import { Log } from './util/log';
import { Machine } from '~/elements/blocks/machine/machine';

import { AnyMessageBuilder } from '~/elements/entities/message/message.builder';
import { AnyBucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { AnyResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import { AnyMachineBuilder } from '~/elements/blocks/machine/machine.builder';
import { AnyJob, Job } from '~/elements/blocks/job/job';
import { AnyJobBuilder } from '~/elements/blocks/job/job.builder';
import { MessageParser } from '~/elements/entities/message/message_parser';
import { $Message } from '~/elements/entities/message/message.schema';
import { Resource } from '~/elements/blocks/resource/resource';
import { Queue } from '~/elements/blocks/queue/queue';
import { Controller } from '~/elements/edge/controller/controller';
import { AnyBucket, Bucket } from '~/elements/entities/bucket/bucket';
import { $ConstantEnum, $ConstantValue, $Constants } from '~/elements/entities/constants/constants.schema';
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';
import { AnyControllerBuilder } from '~/elements/edge/controller/controller.builder';
import { AnyExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import { $Externals } from '~/elements/edge/externals/externals.schema';
import { Tag } from './dependency';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
import { $Machine } from '~/elements/blocks/machine/machine.schema';
import { $Controller } from '~/elements/edge/controller/controller.schema';
import { $Job } from '~/elements/blocks/job/job.schema';
import { AnyResourceJobBuilder } from '~/elements/blocks/job/internal/resource_job.builder';
import { AnyApp } from './apps/app';
import { AnyService } from './apps/service';
import { AnyMachineJobBuilder } from '~/elements/blocks/job/internal/machine_job.builder';
import { AnyQueueBuilder } from '~/elements/blocks/queue/queue.builder';
import { $Queue } from '~/elements/blocks/queue/queue.schema';
import { NQL_Engine } from '~/elements/entities/bucket/query/nql_engine';
import { AnyDaemon, Daemon } from './daemon';
import { $TrashBucket } from './data/trash';
import { AnyTopicBuilder } from '~/elements/blocks/topic/topic.builder';
import { $Topic } from '~/elements/blocks/topic/topic.schema';
import { Topic } from '~/elements/blocks/topic/topic';

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
    AnyQueueBuilder |
    AnyTopicBuilder

export type AnyElementSchema = 
    $Constants |
    $ConstantEnum |
    $ConstantValue |
    $Externals |
    $Message |
    $Bucket |
    $Job |
    $Resource |
    $Machine |
    $Controller |
    $Queue |
    $Topic

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
        messages?: Tag[],
        buckets?: Tag[],
        jobs?: Tag[]
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
        topics: {},
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
    public topics = {} as {
        [B in keyof $['topics']]: Topic<S, $, $['topics'][B]>
    };

    /* Edge */

    public controllers = {} as {
        [B in keyof $['controllers']]: Controller<S, $, $['controllers'][B]>
    };

    /* Trash */

    public trash?: AnyBucket;

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
        },
        public subdir: string[] = []
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
            topics: Object.keys(this.topics),
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
        topics?: $Topic[],
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
        schemas.topics?.forEach(schema => {
            this.schema.topics[schema.name] = schema;
        })
        schemas.controllers?.forEach(schema => {
            this.schema.controllers[schema.name] = schema;
        })
        return this;
    }

    /**
     * Include references for external elements on the module.
     * 
     * @param daemon A `Daemon` instance
     * @param dependencies: A dictionary of dependencies by element type
     * @returns The `Module`, for call-chaining
     */
    public injectRunners(elements: {
        // buckets?: Dependency[],
        jobs?: Record<string, AnyJob>,
        // messages?: Dependency[],
        // machines?: Dependency[]
    }) {
        Object.entries(elements.jobs || {}).forEach(([shortTag, job]) => {
            (this.jobs as any)[shortTag] = job;
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

    // Start

    /**
     * Create elements from schemas, and the NQL engine for this module.
     * 
     * @param app A `App` instance
     * @param services A dictionary of services by name
     */
    public start(app: AnyApp, services: Record<string, AnyService>) {
        
        // .getInfo() avoided due to circular dependency
        const info = {
            spaceModules: (app as any)._spaceModuleNames as AnyApp['_spaceModuleNames'],
            config: (app as any)._config as AnyApp['_config'],
            nesoiNpmPkg: (app as any)._nesoiNpmPkg as AnyApp['_nesoiNpmPkg'],
        };
        
        const config = info.config;

        Object.entries(this.schema.buckets).forEach(([name, schema]) => {
            const bucketConfig = config.modules?.[this.name]?.buckets?.[name];
            (this.buckets as any)[name] = new Bucket(this, schema, bucketConfig, services);
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
            const controllerConfig = config.modules?.[this.name]?.controllers?.[name];
            (this.controllers as any)[name] = new Controller(this, schema, controllerConfig, services);
        })

        Object.entries(this.schema.queues).forEach(([name, schema]) => {
            (this.queues as any)[name] = new Queue(this, schema);
        })
        Object.entries(this.schema.topics).forEach(([name, schema]) => {
            (this.topics as any)[name] = new Topic(this, schema);
        })

        this.nql = new NQL_Engine(this);

        if (config.modules?.[this.name]?.trash) {
            this.trash = new Bucket(this, $TrashBucket, config.modules?.[this.name]?.trash, services);
        }
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

        // Destroy topics
        for (const name in this.topics || []) {
            this.destroyElement('topic', name);
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
        type: 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue' | 'topic',
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
        await virtualModule.start({ _config: {} } as any, {})
        
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

    /**
     * Include references for external elements on the module.
     * This is used to create virtual modules and inline apps.
     * This implementation also includes transitive dependencies.
     * 
     * @param daemon A `Daemon` instance
     * @param dependencies: A dictionary of dependencies by element type
     * @returns The `Module`, for call-chaining
     */
    private injectDependencies(modules: Record<string, AnyModule>, externals: {
        [K in keyof $Externals]?: $Externals[K] extends Record<string, infer X> ? X[] : never
    }) {
        externals.buckets?.forEach(tag => {
            const bucketModule = modules[tag.module];
            const bucket = bucketModule.buckets[tag.name];
            if (!bucket) {
                throw new Error(`Internal Error: unable to find '${tag.full}' during injection to module '${this.name}'`)
            }
            (this.buckets as any)[tag.short] = bucket;
        })
        externals.jobs?.forEach(tag => {
            const jobModule = modules[tag.module];
            const job = jobModule.jobs[tag.name];
            if (!job) {
                throw new Error(`Internal Error: unable to find '${tag.full}' during injection to module '${this.name}'`)
            }
            (this.jobs as any)[tag.short] = job;
            const schema = job.schema as $Job;
            this.injectDependencies(modules, {
                messages: schema.input
            })
        })
        externals.messages?.forEach(tag => {
            const messageModule = modules[tag.module];
            const message = messageModule.messages[tag.name];
            if (!message) {
                throw new Error(`Internal Error: unable to find '${tag.full}' during injection to module '${this.name}'`)
            }
            (this.messages as any)[tag.short] = message;
        })
        externals.machines?.forEach(tag => {
            const machineModule = modules[tag.module];
            const machine = machineModule.machines[tag.name];
            if (!machine) {
                throw new Error(`Internal Error: unable to find '${tag.full}' during injection to module '${this.name}'`)
            }
            (this.machines as any)[tag.short] = machine;
            const schema = machine.schema as $Machine;
            this.injectDependencies(modules, {
                messages: schema.input,
                buckets: schema.buckets,
                jobs: schema.jobs
            })
        })
        externals.enums?.forEach(tag => {
            const enumModule = modules[tag.module];
            const _enum = (enumModule.schema as $Module).constants.enums[tag.name];
            if (!_enum) {
                throw new Error(`Internal Error: unable to find enum '${tag.short}' during injection to module '${this.name}'`)
            }
            this.schema.constants.enums[`${tag.short}`] = _enum;
        })
        externals.values?.forEach(tag => {
            const valueModule = modules[tag.module];
            const _value = (valueModule.schema as $Module).constants.values[tag.name];
            if (!_value) {
                throw new Error(`Internal Error: unable to find value '${tag.short}' during injection to module '${this.name}'`)
            }
            this.schema.constants.values[`${tag.short}`] = _value;
        })
        return this;
    }
}

export type AnyModule = Module<any, any>