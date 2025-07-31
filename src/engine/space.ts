import * as fs from 'fs';
import * as path from 'path';
import { $Module, $Space } from '~/schema';
// import { MachineBuilder } from "~/plugins/machine";
import { MachineBuilder } from '~/elements/blocks/machine/machine.builder';
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';
import { ExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import { JobBuilder } from '~/elements/blocks/job/job.builder';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { ResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import { ControllerBuilder } from '~/elements/edge/controller/controller.builder';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { $Message } from '~/elements/entities/message/message.schema';
import { BucketModelBuilder, BucketModelDef } from '~/elements/entities/bucket/model/bucket_model.builder';
import { $BucketModel } from '~/elements/entities/bucket/model/bucket_model.schema';
import { BucketModelFieldFactory } from '~/elements/entities/bucket/model/bucket_model_field.builder';
import { CompilerError } from '~/compiler/error';
import { QueueBuilder } from '~/elements/blocks/queue/queue.builder';
import { $Bucket, $Job, $Resource } from '~/elements';
import { TopicBuilder } from '~/elements/blocks/topic/topic.builder';

/**
 * When using Nesoi as a framework (not a library), the `Space`
 * is a collection of all modules.
 * The name comes from the linear algebra notion of 'vector space'.
 * It's the 'module space', where all past and future modules exist.
 * 
 * The `Space` is mainly used to:
 * - Declare builders which reference the compiled schemas with a minimal syntax
 * - Read modules from the directory structure to compile schemas and apps 
 * 
 * @category Engine
 */
export class Space<
    $ extends $Space
> {
    private _authn: Record<string, $BucketModel> = {};
    private _name = 'Space';

    /**
     * @param dirpath The path for the Space root directory
     */
    constructor(
        private dirpath: string
    ) {}

    /*
     *  ROOT
     */

    /**
     * Set a custom Space name. The default is 'Space'.
     * > This method MUST be called on the root `nesoi.ts` file.
     * @param name A new Space name
     * @returns The current Space, for call-chaining
     */
    name(name: string) {
        this._name = name;
        return this;
    }

    /**
     * Set one authentication model.
     * This model MUST be yielded by the `AuthnProvider` assigned
     * to the same name.
     * > This method MUST be called on the root `nesoi.ts` file.
     * @param name A name for the authentication
     * @returns The current Space, for call-chaining
     */
    authn<
        Name extends string,
        // This model can't reference any Module block, since it exists on the space scope,
        // so the Module passed is `never`
        // This currently only affects enums (inline enums are still allowed)
        Def extends BucketModelDef<$, never>
    >(name: Name, $: Def) {
        const fieldBuilder = new BucketModelFieldFactory('*');
        const fields = $(fieldBuilder);
        const builder = new BucketModelBuilder('*').fields(fields);
        this._authn[name] = BucketModelBuilder.build(builder);
        return this;
    }

    /*
     *  ELEMENTS
     */

    // Entities
    
    /**
     * > Elements / Entities / Constants
     * 
     * `Constants` represent statically-known data, namely `values` and `enums`,
     * which can be referenced from any `Module`.
     * 
     * @param module A module name
     * @returns A `Constants` builder
     */
    constants<
        M extends keyof $['modules']
    >(module: M) {
        return new ConstantsBuilder(module as string);
    }


    /**
     * > Elements / Entities / Bucket
     * 
     * A `Bucket` represents stored data, on any kind of storage.
     * It contains a definition of the type of data (_model_),
     * the relations between this data and other (_graph_),
     * and different ways to present this data (_view_).
     * 
     * The actual storage is linked through a `BucketAdapter`, on the
     * `App` definition. Which means you build a _Bucket_ without
     * knowing how it's data will be stored, and then later plug
     * any adapter (like Memory, or PostgreSQL, etc) into it.
     * 
     * @param globalName A _Bucket_ name in the format `module::name`
     * @returns A `Bucket` builder
     */
    bucket<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        type Bucket = $Bucket & { name: K }
        // TODO: review why this was not "$Bucket & {...}"
        // type Bucket = Module['buckets'][K] & { name: K }
        return new BucketBuilder<$, Module, Bucket>(
            module,
            name as K
        );
    }

    /**
     * > Elements / Entities / Message
     * 
     * A `Message` represents data in transit (generally incoming).
     * It contains a definition of the data format (_template_),
     * which includes possibly complex validation rules.
     * 
     * This _template_ is used to _parse_ an object into the message format,
     * so a _Message_ has two states: `raw` and `parsed`.
     * - `raw`: A JS object containing a `$` with the message name plus some other properties
     * - `parsed`: A `Message` object containing the parsed data plus some metadata (signature, etc)
     * 
     * @param globalName A message name in the format `module::name`
     * @returns A `Constants` builder
     */
    message<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        type Message = $Message & { name: K }
        return new MessageBuilder<$, Module, Message>(
            module,
            name as K
        );
    }

    // Blocks

    /**
     * > Elements / Blocks / Job
     * 
     * A `Job` is a method which accepts one or more _Messages_ as input.
     * 
     * It might declare _extra_ data to include on the job input, and
     * conditions which must be met before the method is executed.
     * These can be pre-validate a Job before queuing it, or for
     * organizing the job flow in a more declarative way.
     * 
     * This method has access to all elements within it's module.
     * 
     * @param globalName A _Job_ name in the format `module::name`
     * @returns A `Job` builder
     */
    job<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        type Job = $Job & {
            name: K
        }
        return new JobBuilder<
            $, Module, Job
        >(
            module,
            name as K
        );
    }

    /**
     * > Elements / Blocks / Resource
     * 
     * A `Resource` is a fast way to declare simple CRUD _Jobs_ and _Messages_ for a `Bucket`.
     * 
     * It offers 5 types of jobs:
     * - `view`: Read one or all bucket object(s) through a specific view
     * - `query`: Query bucket object(s)
     * - `create`: Create one object on the bucket
     * - `update`: Modify (patch) one object of the bucket
     * - `delete`: Delete one object of the bucket
     * 
     * @param globalName A _Resource_ name in the format `module::name`
     * @returns A `Resource` builder
     */
    resource<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        type Resource = $Resource & { name: K }
        return new ResourceBuilder<
            $, Module, Resource
        >(
            module,
            name as K
        );
    }

    /**
     * > Elements / Blocks / Machine
     * 
     * A `Machine` is a _Statechart_ which reads it's context from a _Bucket_,
     * and uses a specific property to store a discrete state.
     * When this machine receives _Messages_, it follows the definition to possibly
     * advance the state and run _Jobs_.
     * 
     * @param globalName A _Machine_ name in the format `module::name`
     * @returns A `Machine` builder
     */
    machine<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        return new MachineBuilder<
            $, Module, K, Module['machines'][K] & { name: K }
        >(
            module,
            name as K
        );
    }

    /**
     * > Elements / Blocks / Queue
     * 
     * A `Queue` stores _Messages_ to be consumed later in order.
     * 
     * @param globalName A _Queue_ name in the format `module::name`
     * @returns A `Queue` builder
     */
    queue<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(
        globalName: `${M & string}::${K}`,
    ) {
        const [module, name] = globalName.split('::');
        return new QueueBuilder<
            $, Module, Module['queues'][K] & { name: K }
        >(
            module,
            name 
        );
    }

    /**
     * > Elements / Blocks / Topic
     * 
     * A `Topic` is used to broadcast messages to different listeners.
     * 
     * @param globalName A _Topic_ name in the format `module::name`
     * @returns A `Topic` builder
     */
    topic<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(
        globalName: `${M & string}::${K}`,
    ) {
        const [module, name] = globalName.split('::');
        return new TopicBuilder<
            $, Module, Module['topics'][K] & { name: K }
        >(
            module,
            name 
        );
    }

    // Edge

    /**
     * > Elements / Edge / Externals
     * 
     * `Externals` references elements from other modules, allowing
     * them to be used by Jobs and other elements from this module.
     * 
     * @param module A module name
     * @returns A `Externals` builder
     */
    externals<
        M extends keyof $['modules']
    >(module: M) {
        return new ExternalsBuilder<
            $, M
        >(
            module as string
        );
    }

    /**
     * > Elements / Edge / Controller
     * 
     * A `Controller` allows an external application to send
     * and receive messages /from the Nesoi Engine.
     * 
     * The controller declares endpoints which accept specific messages
     * and route them to specific elements.
     * On the `App`, each controller is assigned a `ControllerAdapter`, which
     * is responsible for creating the raw _Messages_ and sending them to the Engine.
     * 
     * @param globalName A _Controller_ name in the format `module::name`
     * @returns A `Controller` builder
     */
    controller<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        return new ControllerBuilder<
            $, Module
        >(
            module,
            name as K
        );
    }

    /*
     *  RUN / COMPILE
     */

    /**
     * Resolve a path relative to the Space root.
     * 
     * @param space A `Space` instance
     * @param relPath One or many path terms
     * @returns A resolved path
     */
    public static path(space: Space<any>, ...relPath: string[]) {
        if (!space.dirpath) {
            throw new Error('Cant use .path() on virtual space')
        }
        return path.resolve(space.dirpath, ...relPath);
    }

    /**
     * Return a path relative to the Space root given an absolute path.
     * 
     * @param space A `Space` instance
     * @param relPath One or many path terms
     * @returns A resolved path
     */
    public static relPath(space: Space<any>, absPath: string) {
        if (!space.dirpath) {
            throw new Error('Cant use .path() on virtual space')
        }
        return path.relative(space.dirpath, absPath);
    }

    /**
     * Read all module directories from the Space root, then
     * run a callback for each.
     * 
     * @param space A `Space` instance
     * @param buildFn A callback to run for each module directory
     */
    public static scan(
        space: Space<any>,
        buildFn: (name: string, path: string, subdir: string[]) => void
    ) {

        if (!fs.existsSync(space.dirpath)) {
            throw CompilerError.DirectoryDoesntExists(space.dirpath);
        }

        const modulesPath = this.path(space, './modules');
        if (!fs.existsSync(modulesPath)) {
            throw CompilerError.NoModulesFolder();
        }

        const perform = (dirpath: string, subdir: string[]) => {
            const dirs = fs.readdirSync(dirpath, { withFileTypes: true })
                .filter(node => node.isDirectory());
                
            for (const dir of dirs) {
                const modulePath = path.join(dirpath, dir.name);
                if (fs.existsSync(path.join(modulePath, '.subset'))) {
                    perform(modulePath, [...subdir, dir.name]);
                }
                else {
                    buildFn(dir.name, modulePath, subdir);
                }
            }
        }

        perform(modulesPath, []);
    }

}

export type AnySpace = Space<$Space>;