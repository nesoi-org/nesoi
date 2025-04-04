import { $Module, $Space } from '~/schema';
import { NesoiError } from '../data/error';
import { AnyModule, Module, VirtualModuleDef } from '../module';
import { AnyTrx } from './trx';
import { BucketTrxNode } from './nodes/bucket.trx_node';
import { JobTrxNode } from './nodes/job.trx_node';
import { QueueTrxNode } from './nodes/queue.trx_node';
import { ResourceTrxNode } from './nodes/resource.trx_node';
import { AnyJob } from '~/elements/blocks/job/job';
import { $Message } from '~/elements/entities/message/message.schema';
import { MessageParser } from '~/elements/entities/message/message_parser';
import { MachineTrxNode } from './nodes/machine.trx_node';
import { AnyUsers } from '../auth/authn';
import { Enum } from '~/elements/entities/constants/constants';
import { KeysOfUnion } from '../util/type';
import { i18n } from '../util/i18n';
import { NesoiDatetime } from '../data/datetime';

/*
    Types
*/

type TrxNodeBlock = 'bucket' | 'message' | 'job' | 'resource' | 'machine' | 'queue' | 'controller'
type TrxNodeState = 'open' | 'ok' | 'error'

export type TrxNodeStatus = {
    id: string
    scope: 'root' | `${string}::${TrxNodeBlock}:${string}` | `${string}::virtual`
    state?: string
    action?: string
    input?: Record<string, any>
    output?: Record<string, any>
    error?: string
    nodes: TrxNodeStatus[]
    app: number
}

/*
    Transaction Node
*/

export class TrxNode<Space extends $Space, M extends $Module, Authn extends AnyUsers> {

    public id: string;
    public globalId: string;
    
    private children: AnyTrxNode[] = [];

    private state?: TrxNodeState;
    private action?: string;
    private input?: Record<string, any>;
    private output?: Record<string, any>;
    private error?: string;

    private time = {
        start: NesoiDatetime.now(),
        end: undefined as NesoiDatetime | undefined
    }
    
    constructor(
        private scope: 'root' | `${string}::${TrxNodeBlock}:${string}` | `${string}::virtual`,
        private trx: AnyTrx,
        private parent: AnyTrxNode | undefined,
        private module: AnyModule,
        private users?: Authn,
        id?: string
    ) {
        if (parent) {
            this.id = id || (Math.random() + 1).toString(36).substring(7);
        } else {
            this.id = '#';
        }
        this.globalId = `${this.trx.id}.${this.id}`;
    }

    static async open(node: AnyTrxNode, action: string, input: Record<string, any>) {
        node.state = 'open';
        node.action = action;
        node.input = input;
    }
    
    static async ok(node: AnyTrxNode, output?: Record<string, any>) {
        node.state = 'ok';
        node.output = output;
        node.time.end = NesoiDatetime.now();
    }
    
    static async error(node: AnyTrxNode, error: any) {
        node.state = 'error';
        node.error = i18n.error(error, node.trx.root.module.daemon);
        node.time.end = NesoiDatetime.now();
    }

    // Entities

    public async message<
        Raw extends M['#input']['#raw'],
        Msg extends $Message = M['messages'][Raw['$'] & keyof M['messages']]
    >(raw: Raw): Promise<M['#input']['#parsed']> {
        const node = TrxNode.makeChildNode(this, this.module.name, 'message', raw.$ as string);
        await TrxNode.open(node, 'parse', raw);
        try {
            const parsed = await MessageParser.parseWithTrxModule(
                node,
                raw
            );
            await TrxNode.ok(node);
            return parsed;
        }
        catch (e) {
            await TrxNode.error(node, e);
            throw e;
        }
    }

    public value<
        K extends keyof M['constants']['values']
    >(key: K) {
        return this.module.schema.constants.values[key as string].value as M['constants']['values'][K]['value'];
    }

    public enum<
        EnumName extends KeysOfUnion<Space['modules'][keyof Space['modules']]['constants']['enums']>
    >(name: EnumName): Enum<M['constants']['enums'][EnumName]> {
        
        const schema = this.module.schema.constants.enums[name as string];
        if (!schema) {
            throw NesoiError.Module.EnumNotFound(this.module, name as string);
        }
        return new Enum<
            M['constants']['enums'][EnumName]
        >(this.module.schema.constants.enums[name as string] as any);
    }

    // Blocks

    public bucket<
        Name extends keyof M['buckets'],
        Bucket extends M['buckets'][Name]
    >(name: Name): BucketTrxNode<M, Bucket> {
        return new BucketTrxNode(this, this.module.buckets[name] as any);
    }

    public job<
        Name extends keyof M['jobs'],
        Job extends M['jobs'][Name]
    >(name: Name): JobTrxNode<M, Job> {
        const job = this.module.jobs[name] as AnyJob;
        if (!job) {
            throw NesoiError.Module.JobNotIncluded(this.module, name as string);
        }
        return new JobTrxNode(this, job);
    }

    // Method for internal use, which allows running a job with a custom context.
    // This is used by composite blocks to pass things such as an object
    // or the previous/next machine states along with the message.
    public static jobWithCustomCtx<
        M extends $Module,
        JobName extends keyof M['jobs'],
        Job extends M['jobs'][JobName]
    >(node: AnyTrxNode, name: string, ctx?: Record<string, any>): JobTrxNode<M, Job> {
        const job = node.module.jobs[name] as AnyJob;
        if (!job) {
            throw NesoiError.Module.JobNotIncluded(node.module, name as string);
        }
        return new JobTrxNode(node, job, ctx);
    }

    public resource<
        Name extends keyof M['resources'],
        Resource extends M['resources'][Name]
    >(name: Name): ResourceTrxNode<M, Resource> {
        const resource = this.module.resources[name];
        if (!resource) {
            throw NesoiError.Module.ResourceNotIncluded(this.module, name as string);
        }
        return new ResourceTrxNode(this, resource);
    }

    public machine<
        Name extends keyof M['machines'],
        Machine extends M['machines'][Name]
    >(name: Name): MachineTrxNode<M, Machine> {
        const machine = this.module.machines[name];
        if (!machine) {
            throw NesoiError.Module.MachineNotIncluded(this.module, name as string);
        }
        return new MachineTrxNode(this, machine);
    }

    public queue<
        Name extends keyof M['queues'],
        Queue extends M['queues'][Name]
    >(name: Name): QueueTrxNode<M, Queue> {
        const queue = this.module.queues[name];
        if (!queue) {
            throw NesoiError.Module.QueueNotIncluded(this.module, name as string);
        }
        return new QueueTrxNode(this, queue);
    }

    // Authentication

    public user<
        U extends keyof Authn & keyof M['#authn']
    >(provider: U): M['#authn'][U] {
        if (!this.users) {
            throw NesoiError.Authn.NoUsersAuthenticatedForTrxNode(this.globalId);
        }
        return this.users[provider as keyof typeof this.users] as any;
    }

    // Virtual Module Transaction

    public async virtual<T>(
        def: VirtualModuleDef,
        fn: ($: AnyTrxNode) => T | Promise<T>
    ): Promise<T> {
        // Build virtual module
        const module = TrxNode.getModule(this);
        const virtualModule = await Module.virtual(module, def);

        // Create trx node of virtual module
        const node = TrxNode.makeVirtualChildNode(this, virtualModule);
        await TrxNode.open(node, 'run', {});
        try {
            const result = await fn(node);
            await TrxNode.ok(node);
            return result;
        }
        catch (e) {
            await TrxNode.error(node, e);
            throw e;
        }
    }

    // Status

    public status(): TrxNodeStatus {
        return {
            id: this.id,
            scope: this.scope,
            state: this.state,
            action: this.action,
            input: this.input,
            output: this.output,
            error: this.error,
            nodes: this.children.map(child => child.status()),
            app: this.time.end ? (this.time.end.epoch - this.time.start.epoch) : -1
        };
    }

    //

    static makeChildNode<Space extends $Space, M extends $Module, Authn extends AnyUsers>(
        node: TrxNode<Space, M, Authn>,
        module: string,
        block: TrxNodeBlock,
        name: string
    ) {
        const child = new TrxNode<Space, M, Authn>(`${module}::${block}:${name}`, node.trx, node, node.module, node.users);
        node.children.push(child);
        node.trx.addNode(child);
        return child;
    }
    
    static makeVirtualChildNode<Space extends $Space, M extends $Module, Authn extends AnyUsers>(
        node: TrxNode<Space, M, Authn>,
        module: AnyModule,
    ) {
        const child = new TrxNode<Space, M, Authn>(`${module.name}::virtual`, node.trx, node, module, node.users);
        node.children.push(child);
        node.trx.addNode(child);
        return child;
    }

    static addUsers(node: AnyTrxNode, users: AnyUsers) {
        Object.assign(node.users, users);
    }

    static getModule(node: AnyTrxNode) {
        return node.module;
    }

    static getFirstUserMatch(node: AnyTrxNode, authnProviders?: Record<string, any>) {
        if (!authnProviders)
            return undefined;
        for (const provider in authnProviders) {
            const user = node.users[provider];
            if (user) {
                return { provider, user };
            }
        }
        return undefined;
    }

    static checkAuthn(node: AnyTrxNode, authnProviderOptions?: string[]) {
        if (!authnProviderOptions?.length)
            return;
        if (node.users) {
            for (const provider of authnProviderOptions) {
                if (provider in node.users) {
                    return
                }
            }
        }
        throw NesoiError.Trx.NotAuthenticated({});
    }

}

export type AnyTrxNode = TrxNode<any, any, any>