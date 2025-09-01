import { Dependency, BuilderNode, Tag } from '~/engine/dependency';
import { AnyResourceJobBuilder } from '~/elements/blocks/job/internal/resource_job.builder';
import { AnyJobBuilder } from '~/elements/blocks/job/job.builder';
import { AnyBucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { BucketGraphBuilder } from '~/elements/entities/bucket/graph/bucket_graph.builder';
import { BucketGraphLinkBuilder } from '~/elements/entities/bucket/graph/bucket_graph_link.builder';
import { AnyExternalsBuilder, ExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import { AnyMessageBuilder } from '~/elements/entities/message/message.builder';
import { MessageTemplateFieldBuilders } from '~/elements/entities/message/template/message_template_field.builder';
import { AnyResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import { AnyMachineBuilder } from '~/elements/blocks/machine/machine.builder';
import { Log, scopeTag } from '~/engine/util/log';
import { AnyBuilder, AnyModule } from '~/engine/module';
import { colored } from '~/engine/util/string';
import { NesoiError } from '~/engine/data/error';
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';
import { AnyQueueBuilder } from '~/elements/blocks/queue/queue.builder';
import path from 'path';
import { AnyTopicBuilder } from '~/elements/blocks/topic/topic.builder';


export type TreeshakeConfig = {
    exclude?: string[]
}

/* @nesoi:browser ignore-start */
import { ProgressiveBuild, ProgressiveBuildCache } from '../compiler/progressive';
import { AnyBucketModelFieldBuilder, BucketModelFieldBuilders } from '~/elements/entities/bucket/model/bucket_model_field.builder';
/* @nesoi:browser ignore-end */

export class Treeshake {

    /* Entry-Points */

    /**
     * Scans the module directory, imports the builders and lists
     * all nodes found.
     * 
     * @returns A list of all `BuilderNodes` found on the module folder
     */
    public static async module(module: AnyModule, cache: ProgressiveBuildCache, config?: TreeshakeConfig) {
        Log.debug('engine', 'treeshake', `Treeshaking ${scopeTag('module',module.name)}`);

        const nodes: BuilderNode[] = [];

        const merge = (node: BuilderNode) => {
            // Merge constants in a single builder
            if (node.tag.type.startsWith('constants')) {
                node.filepath = [node.filepath as string];
                const constants = nodes.find(node => node.tag.type === 'constants');
                if (constants) {
                    ConstantsBuilder.merge(constants.builder as ConstantsBuilder, node.builder as ConstantsBuilder);
                    constants.filepath = [...constants.filepath, ...node.filepath];
                    return;
                }
                else {
                    nodes.push({
                        ...node,
                        tag: new Tag(node.tag.module, 'constants', '*')
                    })
                    return;
                }
            }
            // Merge externals in a single builder
            if (node.tag.type === 'externals') {
                node.filepath = [node.filepath as string];

                // If the external references constants, ensure a constants node is present
                // This ensures there will be a container for the external values, which
                // are copied as "static externals"
                const enums = (node.builder as any).enums as AnyExternalsBuilder['enums'];
                const values = (node.builder as any).values as AnyExternalsBuilder['values'];
                if (Object.keys(enums).length || Object.keys(values).length) {
                    const constants = nodes.find(node => node.tag.type === 'constants');
                    if (!constants) {
                        nodes.push(new BuilderNode({
                            tag: new Tag(node.tag.module, 'constants', '*'),
                            filepath: [],
                            dependencies: [],
                            builder: new ConstantsBuilder(node.tag.module),
                        }))
                    }
                }

                const externals = nodes.find(node => node.tag.type === 'externals');
                if (externals) {
                    ExternalsBuilder.merge(externals.builder as AnyExternalsBuilder, node.builder as AnyExternalsBuilder);
                    externals.filepath = [...externals.filepath, ...node.filepath];
                    return;
                }
            }
            nodes.push(node);
        };

        if (module.boot && 'dirpath' in module.boot) {            
            const files = module.scanFiles(module.boot.dirpath, config?.exclude);
            for (const file of files) {
                const fileNodes = await Treeshake.file(module.name, file, cache);
                fileNodes.forEach(merge);
            }
        }
        else if (module.boot?.builders) {
            const builders = module.boot.builders;
            for (const builder of builders) {
                const builderNodes = await Treeshake.builder(module.name, builder);
                builderNodes.forEach(merge);
            }
        }

        Log.trace('builder', 'treeshake', `Node list of module ${scopeTag('module', module.name)}:`);
        this.logNodeList(nodes);

        Log.trace('builder', 'treeshake', `Node tree of module ${scopeTag('module', module.name)}:`);
        this.logNodeTree(nodes.filter(node => !node.isInline));

        return nodes;
    }

    /**
     * Shakes a file to find all the builders declared on that file, and returns
     * them as BuilderNodes:
     * - Root-level (exported) builders
     * - Inline builders
     * - Nested inline builders
     */
    private static async file(
        module: string,
        filepath: string,
        cache: ProgressiveBuildCache
    ) {
        /* @nesoi:browser ignore-start */
        if (cache && filepath in cache.files) {
            const nodes = await ProgressiveBuild.treeshake(cache, filepath);
            if (nodes) {
                return nodes;
            }
        }
        /* @nesoi:browser ignore-end */

        Log.debug('engine', 'treeshake', ` └ Treeshaking file ${colored(filepath, 'blue')}`);

        // Require is used here to avoid cache - which allows watch mode
        delete require.cache[filepath]
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fileBuilders = require(filepath);

        const nodes: BuilderNode[] = [];

        for (const key in fileBuilders) {
            const builder = fileBuilders[key] as AnyBuilder;
            if (!builder.$b) {
                // TODO: check lib paths to re-enable this message
                // without annoying
                // Log.warn('builder', 'treeshake', `No builder found on file ${filepath}, move it to a library folder or it won't work on the built version.`);
                continue;
            }
            nodes.push(...Treeshake.builder(module, builder, filepath))
        }

        Log.debug('engine', 'treeshake', ` - Nodes: ${colored(nodes.map(node => node.tag.full).join(', '), 'purple')}`);

        cache.files[filepath] = {
            type: nodes.map(node => node.tag.type),
            elements: nodes.map(node =>
                path.join(cache.nesoidir,module,`${node.tag.type}__${node.tag.name}.ts`)
            ).flat(1)
        }
        return nodes;
    }

    /**
     * Shakes a file to find all the builders declared on that file, and returns
     * them as BuilderNodes:
     * - Root-level (exported) builders
     * - Inline builders
     * - Nested inline builders
     */
    private static builder(
        module: string,
        builder: AnyBuilder,
        filepath: string = '*'
    ) {
        Log.debug('engine', 'treeshake', ` └ Treeshaking builder ${colored(builder.$b, 'blue')}`);

        const name = (builder as any).name;
        const node: BuilderNode = {
            tag: new Tag(module, builder.$b, name),
            builder,
            filepath: filepath,
            dependencies: []
        };

        const nodes: BuilderNode[] = [];

        if (builder.$b === 'constants') {
            //
        }
        else if (builder.$b === 'externals') {
            Treeshake.externals(node);
        }
        else if (builder.$b === 'bucket') {
            Treeshake.bucket(node);
        }
        else if (builder.$b === 'message') {
            Treeshake.message(node);
        }
        else if (builder.$b === 'job') {
            const { inlines } = Treeshake.job(node);
            inlines.forEach(inline => {
                nodes.push({
                    ...inline,
                    filepath
                });
            });
        }
        else if (builder.$b === 'resource') {
            const { inlines } = Treeshake.resource(node);
            inlines.forEach(inline => {
                nodes.push({
                    ...inline,
                    filepath
                });
            });
        }
        else if (builder.$b === 'machine') {
            // TODO
            const { inlines } = Treeshake.machine(node);
            inlines.forEach(inline => {
                nodes.push({
                    ...inline,
                    filepath
                });
            });
        }
        else if (builder.$b === 'controller') {
            Treeshake.controller(node);
        }
        else if (builder.$b === 'queue') {
            const { inlines } = Treeshake.queue(node);
            inlines.forEach(inline => {
                nodes.push({
                    ...inline,
                    filepath
                });
            });
        }
        else if (builder.$b === 'topic') {
            const { inlines } = Treeshake.topic(node);
            inlines.forEach(inline => {
                nodes.push({
                    ...inline,
                    filepath
                });
            });
        }
        else {
            throw NesoiError.Module.UnknownBuilderType({} as any, filepath, '', (builder as any).$b);
        }
        nodes.push(node);

        return nodes;
    }

    /* Externals */

    public static externals(node: BuilderNode, depth=1) {
        const b = node.builder as any;
        const $b = b.$b as AnyExternalsBuilder['$b'];
        const enums = b.enums as AnyExternalsBuilder['enums'];
        const values = b.values as AnyExternalsBuilder['values'];
        const buckets = b.buckets as AnyExternalsBuilder['buckets'];
        const messages = b.messages as AnyExternalsBuilder['messages'];
        const jobs = b.jobs as AnyExternalsBuilder['jobs'];
        const machines = b.machines as AnyExternalsBuilder['machines'];

        Log.trace('builder', 'treeshake', `${'  '.repeat(depth)} └ Treeshaking node ${scopeTag($b as any, node.tag.name)}`);

        node.dependencies = [
            ...Object.values(enums),
            ...Object.values(values),
            ...Object.values(buckets),
            ...Object.values(messages),
            ...Object.values(jobs),
            ...Object.values(machines),
        ];
        node.dependencies = this.cleanNodeDependencies(node);
    }

    /* Message */

    public static message(node: BuilderNode, depth=1) {
        const b = node.builder as any;
        const $b = b.$b as AnyMessageBuilder['$b'];
        const _fields = b._template._fields as AnyMessageBuilder['_template']['_fields'];

        Log.trace('builder', 'treeshake', `${'  '.repeat(depth)} └ Treeshaking node ${scopeTag($b as any, node.tag.name)}`);
        node.dependencies = Treeshake.messageFieldTree(node, _fields);
        node.dependencies = this.cleanNodeDependencies(node);
    }

    private static messageFieldTree(
        node: BuilderNode,
        tree: MessageTemplateFieldBuilders
    ) {
        const dependencies: Dependency[] = [];

        if (tree.__ext) {
            dependencies.push(tree.__ext as unknown as Dependency);
        }
        
        Object.values(tree).forEach(child => {
            const c = child as any;
            if (c.type === 'enum') {
                if ('dep' in c.meta.enum!) {
                    dependencies.push(c.meta.enum!.dep);
                }
            }
            else if (c.type === 'id') {
                const ref = c.meta.id!.bucket as Dependency;
                dependencies.push(ref);
            }
            else if (c.type === 'msg') {
                dependencies.push(c.meta.msg);
            }
            else if (c.children) {
                dependencies.push(...Treeshake.messageFieldTree(node, c.children));
            }
        });
        return dependencies;
    }

    /* Bucket */

    public static bucket(node: BuilderNode, depth=1) {
        const b = node.builder as any;
        const $b = b.$b as AnyBucketBuilder['$b'];
        const _extend = b._extend as AnyBucketBuilder['_extend'];
        const graphLinks = b._graph as AnyBucketBuilder['_graph'];
        const _model = b._model as AnyBucketBuilder['_model'];
        
        Log.trace('builder', 'treeshake', `${'  '.repeat(depth)} └ Treeshaking node ${scopeTag($b as any, node.tag.name)}`);
        node.dependencies = [];
        
        if (_extend) {
            node.dependencies.push(_extend);
        }
        if (_model) {
            const builders = b._model.builders as AnyBucketBuilder['_model']['builders'];
            node.dependencies.push(...Treeshake.bucketModelFields(node, builders));
        }

        const graph = new BucketGraphBuilder().links(graphLinks);
        node.dependencies.push(...Treeshake.bucketGraph(node, graph));
        node.dependencies = this.cleanNodeDependencies(node);
    }

    public static bucketModelFields(node: BuilderNode, fields: BucketModelFieldBuilders<any>): Dependency[] {
        const dependencies: Dependency[] = [];
        Object.values(fields).forEach((field: any) => {
            const meta = field.meta as AnyBucketModelFieldBuilder['meta'];
            const crypto = field.crypto as AnyBucketModelFieldBuilder['crypto'];
            const children = field.children as AnyBucketModelFieldBuilder['children'];
            if (meta?.enum && 'dep' in meta.enum) {
                dependencies.push(meta.enum.dep)
            }
            if (crypto) {
                dependencies.push(crypto.value)
            }
            if (children?.length) {
                dependencies.push(...Treeshake.bucketModelFields(node, children))
            }
        })
        return dependencies;
    }

    public static bucketGraph(node: BuilderNode, builder: BucketGraphBuilder<any>): Dependency[] {
        const b = builder as any;
        const _links = b._links as BucketGraphBuilder<any>['_links'];

        return Object.values(_links).map((link: any) => {
            const dep = Treeshake.bucketGraphLink(link);
            if (dep.tag.full === node.tag.full) {
                return undefined as any;
            }
            return dep;
        }).filter(d => !!d);
    }

    private static bucketGraphLink(builder: BucketGraphLinkBuilder<any, any, any>): Dependency {
        const b = builder as any;
        const bucket = b.bucket as BucketGraphLinkBuilder<any, any, any>['bucket'];
        return bucket;
    }

    /* Block */

    protected static blockIO(node: BuilderNode): Dependency[] {
        const b = node.builder as any;
        const _inputMsgs = b._inputMsgs as AnyJobBuilder['_inputMsgs'];
        const _inlineNodes = b._inlineNodes as AnyJobBuilder['_inlineNodes'];

        const nonInlineIO = [
            ..._inputMsgs.filter(dep =>
                !_inlineNodes.some(node => node.tag.full === dep.tag.full)
            )
        ];

        return nonInlineIO;
    }

    protected static blockInlineNodes(node: BuilderNode, depth=1) {
        const b = node.builder as any;
        const _inlineNodes = b._inlineNodes as AnyJobBuilder['_inlineNodes'];
        
        const dependencies: Dependency[] = [];
        const nestedInlines: BuilderNode[] = [];
        
        // Finds the dependencies of each inline node
        for (const inlineNode of _inlineNodes) {
            // Inherit information from parent node
            inlineNode.filepath = node.filepath;
            
            if (inlineNode.tag.type === 'message') {
                Treeshake.message(inlineNode, depth+1);
                dependencies.push(...inlineNode.dependencies);
            }
            else if (inlineNode.tag.type === 'job') {
                const deps = Treeshake.job(inlineNode, depth+1);
                dependencies.push(...inlineNode.dependencies);
                nestedInlines.push(...deps.inlines);
            }
        }

        const inlines = [..._inlineNodes, ...nestedInlines];
        
        // Inlines were a build dependency of their parent node
        // Now, inlines are ignored on build order
        //
        // inlines.forEach(inline => {
        //     dependencies.push(new Dependency(node.tag.module, inline.tag, { build: true }));
        // });

        return {
            dependencies,
            inlines
        };
    }

    /* Job */

    public static job(node: BuilderNode, depth = 0) {
        const builder = node.builder as AnyJobBuilder | AnyResourceJobBuilder;
               
        Log.trace('builder', 'treeshake', `${'  '.repeat(depth)} └ Treeshaking node ${scopeTag(builder.$b as any, node.tag.name)}`);

        const inlineTreeshake = Treeshake.blockInlineNodes(node, depth);
        node.dependencies = [
            ...Treeshake.blockIO(node),
            ...inlineTreeshake.dependencies
        ];
        node.dependencies = this.cleanNodeDependencies(node);

        return { inlines: inlineTreeshake.inlines };
    }

    /* Resource */

    public static resource(node: BuilderNode, depth=1) {
        const b = node.builder as any;
        const $b = b.$b as AnyResourceBuilder['$b'];
        const _bucket = b._bucket as AnyResourceBuilder['_bucket'];

        Log.trace('builder', 'treeshake', `${'  '.repeat(depth)} └ Treeshaking node ${scopeTag($b as any, node.tag.name)}`);

        const inlineTreeshake = Treeshake.blockInlineNodes(node, depth);
        node.dependencies = [
            _bucket,
            ...inlineTreeshake.dependencies
        ];
        node.dependencies = this.cleanNodeDependencies(node);

        return { inlines: inlineTreeshake.inlines };
    }

    /* Machine */

    public static machine(node: BuilderNode, depth=1) {
        const b = node.builder as any;
        const $b = b.$b as AnyMachineBuilder['$b'];
        const _buckets = b._buckets as AnyMachineBuilder['_buckets'];

        Log.trace('builder', 'treeshake', `${'  '.repeat(depth)} └ Treeshaking node ${scopeTag($b as any, node.tag.name)}`);

        const buckets = _buckets as AnyMachineBuilder['_buckets'];

        node.dependencies = [...buckets];
        
        const inlineTreeshake = Treeshake.blockInlineNodes(node, depth);
        node.dependencies.push(...inlineTreeshake.dependencies);
        node.dependencies = this.cleanNodeDependencies(node);

        return { inlines: inlineTreeshake.inlines };
    }

    /* Controller */

    public static controller(node: BuilderNode) {
        const b = node.builder as any;
        node.dependencies = [];
    }

    /* Queue */

    public static queue(node: BuilderNode) {
        const builder = node.builder as AnyQueueBuilder;
               
        Log.trace('builder', 'treeshake', `└ Treeshaking node ${scopeTag(builder.$b as any, node.tag.name)}`);

        const inlineTreeshake = Treeshake.blockInlineNodes(node);
        node.dependencies = [
            ...Treeshake.blockIO(node),
            ...inlineTreeshake.dependencies
        ];
        node.dependencies = this.cleanNodeDependencies(node);

        return { inlines: inlineTreeshake.inlines };
    }

    /* Topic */

    public static topic(node: BuilderNode) {
        const builder = node.builder as AnyTopicBuilder;
               
        Log.trace('builder', 'treeshake', `└ Treeshaking node ${scopeTag(builder.$b as any, node.tag.name)}`);

        const inlineTreeshake = Treeshake.blockInlineNodes(node);
        node.dependencies = [
            ...Treeshake.blockIO(node),
            ...inlineTreeshake.dependencies
        ];
        node.dependencies = this.cleanNodeDependencies(node);

        return { inlines: inlineTreeshake.inlines };
    }

    // Utility

    private static cleanNodeDependencies(node: BuilderNode) {
        let filtered: Dependency[] = [];
        
        // Remove duplicates
        node.dependencies.forEach(dep => {
            if (!filtered.find(f => Tag.matches(dep.tag, f.tag))) {
                filtered.push(dep);
            }
        });

        // Removes self-dependency
        filtered = filtered
            .filter(dep => dep.tag !== node.tag);

        return filtered;
    }

    private static logNodeList(nodes: BuilderNode[]) {
        nodes
            .map(node => ({
                node,
                tag: scopeTag(node.tag.type, node.tag.name)
            }))
            .sort((a,b) =>
                a.tag.localeCompare(b.tag)
            )
            .forEach(({node, tag}) => {
                Log.trace('builder', 'treeshake', `  └ ${tag} ` + colored(`@ ${node.filepath}`, 'purple'));
            });
    }

    private static logNodeTree(nodes: BuilderNode[], depth=1) {
        nodes
            .map(node => ({
                node,
                tag: scopeTag(node.tag.type, node.tag.name)
            }))
            .sort((a,b) =>
                a.tag.localeCompare(b.tag)
            )
            .forEach(({node, tag}) => {
                Log.debug('engine', 'treeshake', `${'  '.repeat(depth)} └ ${tag} ` + colored(`@ ${node.filepath}`, 'purple'));
                if (node.progressive) {
                    Log.debug('engine', 'treeshake', `${'  '.repeat(depth+1)}` + colored('[cache]', 'green'));
                    return;
                }
                if (node.dependencies.length) {
                    Log.debug('engine', 'treeshake', colored(`${'  '.repeat(depth)}   (depends on: ${node.dependencies.map(dep => dep.tag.full).join(', ')})`, 'purple'));
                }
                if ('_inlineNodes' in node.builder) {
                    const inlineNodes = node.builder['_inlineNodes'];
                    this.logNodeTree(inlineNodes, depth+1);
                }
            });
    }
}