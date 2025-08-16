import { $Space } from '~/schema';
import { Space } from '../../space';
import { Daemon } from '~/engine/daemon';
import { DistributedAppConfig } from './distributed.app.config';
import { App } from '../app';
import { DistributedNodeApp, DistributedAppNodeDef, DistributedNodeDaemon } from './distributed_node.app';
import { AnyElementSchema } from '~/engine/module';
import { Compiler } from '~/compiler/compiler';
import { DistributedCompiler , DistributedCompilerConfig } from '~/compiler/apps/distributed/distributed_compiler';

/**
 * @category App
 * @subcategory Distributed
 */
export class DistributedApp<
    S extends $Space,
    Name extends string,
    Nodes extends Record<string, DistributedNodeApp<any, any, any, any>> = {}
> extends App<S, never, never> {

    public nodes: Nodes = {} as any;

    constructor(
        name: Name,
        space?: Space<S>
    ) {
        super(name, { builders: [] });
        this.builders = undefined;
        this.space = space;
    }

    // Override App abstract methods

    public static compile(compiler: Compiler, appPath: string, config?: DistributedCompilerConfig) {
        return new DistributedCompiler(compiler, appPath, config)
            .run();
    }

    public boot(): DistributedApp<S, Name, Nodes> {
        return this;
    }

    public async daemon() {
        const config = this._config as DistributedAppConfig<any, any, any, any>;
        const daemon = new DistributedDaemon<S, {
            [N in keyof Nodes as `${Name}-${N & string}`]: Nodes[N]
        }>(this.name, config);
        await daemon.boot(this.nodes as any);
        return daemon;
    }
    
    // Type Builder Overrides

    public node<
        N extends string,
        ModuleNames extends string,
        Services extends Record<string, any>,
        Def extends DistributedAppNodeDef<S, Nodes, ModuleNames, Services>
    >(name: N, def: Def): DistributedApp<S, Name, Nodes & {
        [K in N]: ReturnType<Def>
    }> {
        let node = new DistributedNodeApp(`${this.name}-${name}`, this.space);
        node = def(node as any) as any;
        (this.nodes as any)[node.name] = node;
        return this as never;
    }
}

/**
 * @category App
 * @subcategory Distributed
 */
export class DistributedDaemon<
    S extends $Space,
    Nodes extends Record<string, DistributedNodeApp<any, any, any, any>>
> extends Daemon<S, never> {

    protected async getSchema(tag: { module: keyof S['modules'], type: string, name: string }): Promise<AnyElementSchema> {
        // const trxEngine = this.trxEngines[tag.module as keyof typeof this.trxEngines];
        // const _module = trxEngine.getModule();
        // const schema = $Dependency.resolve(_module.schema, tag);
        // if (!schema) {
        //     throw new Error(`Unable to reach schema '${tag}'`)
        // }
        // return Promise.resolve(schema);
        throw new Error('Not implemented yet');
    }


    public nodes: {
        [K in keyof Nodes]: DistributedNodeDaemon<S, Nodes[K] extends DistributedNodeApp<any, any, infer X, any> ? X : never>
    } = {} as any;
    
    constructor(
        name: string,
        config: DistributedAppConfig<any, any, any, any>
    ) {
        super(name, {} as any, {}, config as any);
    }

    public async boot(nodes: Nodes) {
        for (const name in nodes) {
            this.nodes[name] = await nodes[name].daemon();
        }
    }
}