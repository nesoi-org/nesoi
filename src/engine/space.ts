import * as fs from 'fs';
import * as path from 'path';
import { $Module, $Space } from '~/schema';
// import { MachineBuilder } from "~/plugins/machine";
import { MachineBuilder } from '~/elements/blocks/machine/machine.builder';
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';
import { ExternalsBuilder } from '~/elements/blocks/externals/externals.builder';
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
import { BucketModelInfer } from '~/elements/entities/bucket/model/bucket_model.infer';
import { QueueBuilder } from '~/elements/blocks/queue/queue.builder';
import { $Bucket, $Job, $Resource } from '~/elements';

export class Space<
    $ extends $Space
> {
    private _authn: Record<string, $BucketModel> = {};
    private _name = 'App';

    constructor(
        private dirname: string
    ) {}

    /**
     * Space Settings
     * - Name
     * - Authentication
     */

    name(name: string) {
        this._name = name;
        return this;
    }

    authn<
        Name extends string,
        // This model can't reference any Module block, so the Module passed is `never`
        // This currently only affects enums (local enums are still allowed)
        Def extends BucketModelDef<$, never>,
        Obj = BucketModelInfer<Def>
    >(name: Name, $: Def) {
        const fieldBuilder = new BucketModelFieldFactory('*');
        const fields = $(fieldBuilder);
        const builder = new BucketModelBuilder('*').fields(fields);
        this._authn[name] = BucketModelBuilder.build(builder);
        return this;
    }

    // Statics
    
    externals<
        M extends keyof $['modules']
    >(module: M) {
        return new ExternalsBuilder<
            $, M
        >(
            module as string
        );
    }

    constants<
        M extends keyof $['modules']
    >(module: M) {
        return new ConstantsBuilder(module as string);
    }

    // Entities

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

    job<
        M extends keyof $['modules'],
        K extends string,
        Module extends $Module = $['modules'][M]
    >(globalName: `${M & string}::${K}`) {
        const [module, name] = globalName.split('::');
        type Job = $Job & { name: K }
        return new JobBuilder<
            $, Module, Job
        >(
            module,
            name as K
        );
    }

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

    // Edge

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
     * 
     */

    public static path(space: Space<any>, ...relPath: string[]) {
        if (!space.dirname) {
            throw new Error('Cant use .path() on virtual space')
        }
        return path.resolve(space.dirname, ...relPath);
    }

    public static relPath(space: Space<any>, absPath: string) {
        if (!space.dirname) {
            throw new Error('Cant use .path() on virtual space')
        }
        return path.relative(space.dirname, absPath);
    }

    public static scan(
        space: Space<any>,
        buildFn: (name: string, path: string) => void
    ) {

        if (!fs.existsSync(space.dirname)) {
            throw CompilerError.DirectoryDoesntExists(space.dirname);
        }

        const modulesPath = this.path(space, './modules');
        if (!fs.existsSync(modulesPath)) {
            throw CompilerError.NoModulesFolder();
        }

        const dirs = fs.readdirSync(modulesPath, { withFileTypes: true })
            .filter(node => node.isDirectory());
        for (const dir of dirs) {
            buildFn(dir.name, path.join(modulesPath, dir.name));
        }

    }

}

export type AnySpace = Space<$Space>;