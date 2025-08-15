import { $Module, BuilderType } from '~/schema';
import { $Dependency, BuilderNode, ResolvedBuilderNode } from './dependency';
import { AnyModule, Module } from './module';
import { CompilerError } from '~/compiler/error';
import { Log, scopeTag } from './util/log';
import { colored } from './util/string';
import { Treeshake, TreeshakeConfig } from '~/compiler/treeshake';
import { BlockBuilder } from '~/elements/blocks/block.builder';

type ModuleTreeLayer = ResolvedBuilderNode[]
type TraverseCallback = (node: ResolvedBuilderNode) => Promise<void>

/* @nesoi:browser ignore-start */
import { ProgressiveBuildCache } from '~/compiler/progressive';
/* @nesoi:browser ignore-end */

/**
 * A tree of module elements which allows building in the correct order.
 * 
 * @category Engine
 */
export class ModuleTree {

    private layers: ModuleTreeLayer[] = [];

    /**
     * @param modules A dictionary of modules by name
     * @param config Optional configuration for the treeshaking process
     */
    constructor(
        public modules: Record<string, AnyModule>,
        public config?: TreeshakeConfig
    ) {}

    /**
     * Build the tree from existing modules on the Space.
     * - Treeshakes each element to identify it's dependencies
     * - Resolves each found dependency forming a tree
     * - Groups tree into layers which can be built in isolation
     */
    public async resolve(cache?: ProgressiveBuildCache) {

        cache ??= {
            nesoidir: '',
            hash: {
                $: '',
                files: {},
                modules: {},
                space: ''
            },
            files: {},
            modules: {},
            types: {
                space: {},
                modules: {},
                elements: {}
            }
        }

        const nodesByModule = await this.treeshake(cache);
        const resolvedNodes = await this.resolveDependencies(nodesByModule);
        this.layers = this.resolveLayers(resolvedNodes);
    }

    /**
     * Read the module elements from files and identify
     * all related nodes.
     * 
     * @returns A dictionary of nodes by module name
     */
    private async treeshake(cache: ProgressiveBuildCache) {
        Log.debug('compiler', 'tree', 'Treeshaking');
        
        const nodesByModule: Record<string, BuilderNode[]> = {};
        for (const m in this.modules) {
            const module = this.modules[m];
            const nodes = await Treeshake.module(module, cache, this.config);
            nodesByModule[module.name] = nodes;
        }

        return nodesByModule;
    }

    /**
     * Each element declares it's dependencies as a `$Dependency`.
     * In order to assemble the build layers, it's necessary to
     * resolve them into a graph of `ResolvedBuilderNode`s.
     * This also resolves the inline nodes, to allow merging the schemas
     * of inline nodes on build.
     * 
     * @param nodesByModule A dictionary of builder nodes by module name
     * @returns A dictionary of resolved builder nodes
     */
    private async resolveDependencies(nodesByModule: Record<string, BuilderNode[]>) {
        Log.debug('compiler', 'tree', 'Resolving dependencies');

        const resolved: Record<string, ResolvedBuilderNode> = {};

        Object.entries(nodesByModule).forEach(([module, nodes]) => {
            Log.debug('compiler', 'tree', `Resolving dependencies of ${scopeTag('module', module)}`);
            nodes.forEach(node => {
                Log.trace('compiler', 'tree', ` └ ${scopeTag(node.type, node.name)}`);

                const dependencies = node.dependencies.map(dep => {

                    // Find dependency module
                    const depModuleNodes = nodesByModule[dep.module || module];
                    if (!depModuleNodes) {
                        throw CompilerError.UnmetModuleDependency(node.name+'.'+node.type, dep.module || module);
                    }
                    // Find dependency node
                    const depNode = depModuleNodes.find(mNode => mNode.tag === dep.tag);
                    if (!depNode) { 
                        throw CompilerError.UnmetDependency(node.tag, dep.tag);
                    }
                    Log.trace('compiler', 'tree', `   ~ ${colored('OK','green')} ${colored(dep.module+'::'+dep.type+':'+dep.name, 'purple')}`);

                    // If dependency node was not resolved yet, create a shared reference
                    // on which the `dependencies` and `inlines` will be populated on future iterations.
                    if (!(dep.tag in resolved)) {
                        resolved[dep.tag] = {
                            ...depNode,
                            dependencies: [],
                            inlines: {}
                        };
                    }
                    return { node: resolved[dep.tag], soft: dep.soft };
                });

                const inlines: ResolvedBuilderNode['inlines'] = {};
                
                if (!node.progressive) {
                    if ('_inlineNodes' in node.builder) {
                        const inlineNodes = (node.builder as any)._inlineNodes as BlockBuilder<any, any, any>['_inlineNodes'];
                        inlineNodes.forEach((inline: BuilderNode) => {
                            Log.trace('compiler', 'tree', `   └ ${colored('OK','green')} ${colored(inline.module+'::'+inline.type+':'+inline.name, 'lightcyan')}`);
    
                            // If inline node was not resolved yet, create a shared reference
                            // on which the `dependencies` and `inlines` will be populated on future iterations.
                            if (!(inline.tag in resolved)) {
                                resolved[inline.tag] = {
                                    ...inline,
                                    dependencies: [],
                                    inlines: {}
                                };
                            }
                            const type = inline.type as 'message' | 'job';
                            if (!(type in inlines)) {
                                inlines[type] = {
                                    [inline.name]: resolved[inline.tag] as any
                                };
                            }
                            (inlines[type] as any)[inline.name] = resolved[inline.tag];
                        });
                    }
                }

                // If node was already created when resolving a dependendant,
                // just fill the dependencies and inlines.
                if (node.tag in resolved) {
                    resolved[node.tag].dependencies = dependencies;
                    resolved[node.tag].inlines = inlines;
                }
                // If not, create the resolved node
                else {
                    resolved[node.tag] = {
                        ...node,
                        dependencies,
                        inlines
                    };
                }
            });
        });
        
        const resolvedNodes = Object.values(resolved);
        
        // After building all nodes, resolve roots of inline nodes
        // (the non-inline builder which contains the node)
        resolvedNodes.forEach(node => {
            if (node.isInline) { return; }
            const inlines = this.getAllInlineNodes(node);
            inlines.forEach(inline => {
                inline.root = node;
            });
        });

        // Remove from nodes the dependencies which are rooted on the node,
        // but are not the node itself. (Inner dependencies)
        // This is done because these dependencies should be correctly built by
        // the node's builder.
        resolvedNodes.forEach(node => {
            node.dependencies = node.dependencies.filter(dep => dep.node.root != node);
        });

        return resolvedNodes;
    }

    /**
     * Recursively extract all inline nodes from a resolved builder node.
     * 
     * @param node A resolved builder node
     * @returns A list of resolved builder nodes
     */
    private getAllInlineNodes(node: ResolvedBuilderNode) {
        const inlineNodes: ResolvedBuilderNode[] = [];
        if (node.inlines.message) {
            inlineNodes.push(...Object.values(node.inlines.message));
        }
        if (node.inlines.job) {
            inlineNodes.push(...Object.values(node.inlines.job));
        }
        if (inlineNodes.length) {
            Object.assign([], inlineNodes).forEach(inline => {
                inlineNodes.push(...this.getAllInlineNodes(inline));
            });
        }
        return inlineNodes;
    }

    /**
     * Build a list of layers (a _layer_ is a list of resolved builder nodes),
     * each of which can be separately built, in a specific order, so all
     * the dependencies of a node are built before the node itself.
     * 
     * @param nodes A list of resolved builder nodes
     * @returns A list of module tree layers
     */
    private resolveLayers(nodes: ResolvedBuilderNode[]) {
        Log.debug('compiler', 'tree', 'Resolving Layers');

        nodes.forEach(node => {
            node._dependencies = [...(node.dependencies || [])]
                .filter(dep => !dep.soft)
                .map(dep => dep.node);
        })

        const layers: ModuleTreeLayer[] = [];

        while (nodes.length) {
            Log.trace('compiler', 'tree', ` └ ${colored(`layer.${layers.length}`, 'lightblue')}`);

            let layer: ModuleTreeLayer = [];
            const future: ResolvedBuilderNode[] = [];

            nodes.forEach(node => {
                // Node has no dependency, it belongs to the current list
                // and can be flagged as seen.
                if (node._dependencies!.length == 0) {
                    layer.push(node);
                    node.layered = true;
                    Log.trace('compiler', 'tree', `   └ ${node.module}::${scopeTag(node.type, node.name)}` + (node.root ? colored(` @ ${node.root?.tag}`, 'purple') : ''));
                }
                // Node has dependencies, so it must be on future layers.
                else {
                    future.push(node);
                }
            });

            // Remove from future dependencies those who were already seen
            future.forEach(node => {
                node._dependencies = node._dependencies!.filter(dep => !dep.layered);
            });

            // If all nodes have a dependency, this means there's at least 1 circular dependency
            // Nesoi doesn't support partial building (yet?), so circular dependencies between blocks
            // are not permitted.
            if (future.length === nodes.length) {
                nodes.forEach(node => {
                    Log.trace('compiler', 'tree', `   └ ${colored('(future)', 'lightred')} ${node.module}::${scopeTag(node.type, node.name)}` + (node.root ? colored(` @ ${node.root?.tag}`, 'purple') : ''));
                    Log.trace('compiler', 'tree', colored(`     depends on: ${node._dependencies!.map(dep => dep.module+'::'+dep.type+':'+dep.name+(dep.layered ? '(OK)' : '')).join(', ')}`, 'purple'));
                });
                throw CompilerError.CircularDependency();
            }

            nodes = future;

            // Reorder layer so that externals are built first
            const externals = layer.filter(node => node.type === 'externals');
            const internals = layer.filter(node => node.type !== 'externals');
            layer = [...externals, ...internals];

            layers.push(layer);
        }

        layers.forEach(layer => {
            layer.forEach(node => {
                delete node.layered;
                delete node._dependencies;
            })
        })

        return layers;
    }

    /**
     * Traverse tree layers and run the callback `fn` for each node of each layer.
     * 
     * @param actionAlias Action alias to be logged
     * @param fn Callback to be run for each node
     */
    public async traverse(actionAlias: string, fn: TraverseCallback) {
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            Log.debug('compiler', 'tree', `${actionAlias} ${scopeTag('layer', i.toString())}`);

            for (const node of layer) {
                await fn(node);
            }
        }
    }

    /**
     * Get schema of a dependency-like object.
     * 
     * @param node A dependency-like object
     * @return An element schema
     */
    public getSchema(node: {
        module: string
        type: BuilderType
        name: string
    }) {
        const mod = this.modules[node.module] as Module<any, $Module>;
        const schema = $Dependency.resolve(mod.schema, node as $Dependency);
        if (!schema) {
            throw CompilerError.UnmetDependency('tree', node.name);
        }
        return schema;
    }

    /**
     * Return a list of all nodes of all modules on the tree.
     * 
     * @returns A list of resolved builder nodes
     */
    public allNodes() {
        const nodes: ResolvedBuilderNode[] = [];
        for (const layer of this.layers) {
            for (const node of layer) {
                nodes.push(node)
            }
        }
        return nodes;
    }

    /**
     * Return a list of all nodes of all modules on the tree.
     * 
     * @returns A list of resolved builder nodes
     */
    public allNodesByModule() {
        const modules: Record<string, ResolvedBuilderNode[]> = {};
        for (const layer of this.layers) {
            for (const node of layer) {
                modules[node.module] ??= []
                modules[node.module].push(node)
            }
        }
        return modules;
    }
}
