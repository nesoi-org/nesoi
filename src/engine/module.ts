import type { AnyMessageBuilder } from '~/elements/entities/message/message.builder';
import type { AnyBucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import type { AnyResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import type { AnyMachineBuilder } from '~/elements/blocks/machine/machine.builder';
import type { AnyJob} from '~/elements/blocks/job/job';
import type { AnyJobBuilder } from '~/elements/blocks/job/job.builder';
import type { AnyBucket} from '~/elements/entities/bucket/bucket';
import type { AnyControllerBuilder } from '~/elements/edge/controller/controller.builder';
import type { AnyExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import type { AnyResourceJobBuilder } from '~/elements/blocks/job/internal/resource_job.builder';
import type { AnyApp } from './app/app';
import type { AnyService } from './app/service';
import type { AnyMachineJobBuilder } from '~/elements/blocks/job/internal/machine_job.builder';
import type { AnyQueueBuilder } from '~/elements/blocks/queue/queue.builder';
import type { AnyDaemon} from './daemon';
import type { AnyTopicBuilder } from '~/elements/blocks/topic/topic.builder';
import type { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';

import * as fs from 'fs';
import * as path from 'path';

import { Log } from './util/log';
import { $Constants } from '~/elements/entities/constants/constants.schema';
import { $Externals } from '~/elements/edge/externals/externals.schema';
import { $TrashBucket } from './data/trash';
import { Daemon } from './daemon';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { MessageParser } from '~/elements/entities/message/message_parser';
import { Job } from '~/elements/blocks/job/job';
import { Queue } from '~/elements/blocks/queue/queue';
import { Machine } from '~/elements/blocks/machine/machine';
import { Resource } from '~/elements/blocks/resource/resource';
import { Topic } from '~/elements/blocks/topic/topic';
import { Controller } from '~/elements/edge/controller/controller';
import { CLIControllerAdapter } from '~/elements/edge/controller/adapters/cli.controller_adapter';

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
    schema: $;

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
        this.schema = {
            name: name,
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
        } as never;
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
     * Create elements from schemas
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

        for (const name in this.schema.buckets) {
            const schema = this.schema.buckets[name];
            const bucketConfig = config.modules?.[this.name]?.buckets?.[name];
            const bucket = new Bucket(this, schema, bucketConfig, services);
            (this.buckets as any)[name] = bucket;
        }

        for (const name in this.schema.messages) {
            const schema = this.schema.messages[name];
            (this.messages as any)[name] = new MessageParser(schema);
        }

        for (const name in this.schema.jobs) {
            const schema = this.schema.jobs[name];
            (this.jobs as any)[name] = new Job(this, schema);
        }

        for (const name in this.schema.resources) {
            const schema = this.schema.resources[name];
            (this.resources as any)[name] = new Resource(this, schema);
        }

        for (const name in this.schema.machines) {
            const schema = this.schema.machines[name];
            (this.machines as any)[name] = new Machine(this, schema);
        }

        for (const name in this.schema.controllers) {
            const schema = this.schema.controllers[name];
            const controllerConfig = config.modules?.[this.name]?.controllers?.[name];
            (this.controllers as any)[name] = new Controller(this, schema, controllerConfig, services, new CLIControllerAdapter(this.schema, schema));
        }

        for (const name in this.schema.queues) {
            const schema = this.schema.queues[name];
            (this.queues as any)[name] = new Queue(this, schema);
        }

        for (const name in this.schema.topics) {
            const schema = this.schema.topics[name];
            (this.topics as any)[name] = new Topic(this, schema);
        }

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
        virtualModule.daemon = daemon;

        // Inject schemas
        if (def.schemas) {
            virtualModule.inject(def.schemas)
        }

        // Build schemas
        virtualModule.start({ _config: {} } as any, {})
        
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