import { BuilderType } from '~/schema';
import { AnyBuilder, AnyElementSchema } from './module';
import { Overlay } from './util/type';
import { NameHelpers } from '~/compiler/helpers/name_helpers';
import { JobBuilderNode } from '~/elements/blocks/job/job.builder';
import { MessageBuilderNode } from '~/elements/entities/message/message.builder';
import { ResourceJobBuilderNode } from '~/elements/blocks/job/internal/resource_job.builder';
import { BucketFnExtract, JobFnExtract, MachineFnExtract, MessageFnExtract } from '~/compiler/typescript/bridge/organize';
import { MachineJobBuilderNode } from '~/elements/blocks/job/internal/machine_job.builder';


/**
 * Utility class for parsing element `tags`.
 * 
 * A `tag` is a string which references an element
 * on the `Space`, following one of the formats below:
 * ```
 * module::type:name
 * module::name
 * type:name
 * name
 * ```
 * 
 * @category Engine
 */
export class $Tag {

    /**
     * Parse `module?`, `type?` and `name` from a tag string.
     * 
     * @param tag A tag string
     * @returns An object containing the parsed tag info or `undefined`
     * if it's an invalid tag.
     */
    public static parse(tag: string) {
        const match = tag.match(/(.\w*?::)?(\w*?:)?(.*)/);
        const module = match?.[1]?.slice(0,-2);
        const type = match?.[2]?.slice(0,-1);
        const name = match?.[3]
        if (!match
            || (module && module.includes(':'))
            || (type && type.includes(':'))
            || !name
            || name.includes(':')
        ) { return }
        return { module, type, name }
    }
    
    /**
     * Parse `module?`, `type?` and `name` from a tag string.
     * 
     * @param tag A tag string
     * @returns An object containing the parsed tag info
     * @throws If it's an invalid tag
     */
    public static parseOrFail(tag: string) {
        const match = tag.match(/(.\w*?::)?(\w*?:)?(.*)/);
        if (!match) {
            throw new Error(`Internal error: Invalid tag ${tag}`);
        }
        const module = match[1]?.slice(0,-2) as string|undefined;
        if (module && module.includes(':')) {
            throw new Error(`Internal error: Invalid tag ${tag}, module ${module} includes invalid characters`);
        }
        const type = match[2]?.slice(0,-1) as string|undefined;
        if (type && type.includes(':')) {
            throw new Error(`Internal error: Invalid tag ${tag}, type ${type} includes invalid characters`);
        }
        const name = match[3]
        if (!name) {
            throw new Error(`Internal error: Invalid tag ${tag}, no name specified`);
        }
        if (name.includes(':')) {
            throw new Error(`Internal error: Invalid tag ${tag}, name ${name} includes invalid characters`);
        }
        return { module, type, name }
    }
}

/**
 * A reference for an element, declared from another element.
 * 
 * @category Engine
 */
export class $Dependency {

    /** Low name of the module*/
    public module: string     

    /** Type of node */
    public type: BuilderType

    /** Low name of the node */
    public name: string

    /** `module::type:name` */
    public tag: string

    /** `name` if dependency is local, `module::name` if is external */
    public refName: string

    /** If true, this dependency doesn't affect build order */
    public soft: boolean

    /**
     * @param fromModule Name of module which uses this dependency
     * @param type Type of referenced element
     * @param name Name of referenced element
     * @param soft True if this doesn't affect build order
     */
    constructor(
        fromModule: string,
        type: BuilderType,
        name: string,
        soft = false
    ) {
        this.type = type;
        this.soft = soft;
        
        const parsed = $Tag.parseOrFail(name);
        this.name = parsed.name
        if (parsed.module) {
            this.module = parsed.module
        }
        else {
            this.module = fromModule
        }  
        this.tag = `${this.module}::${this.type}:${this.name}`

        if (this.module === fromModule) {
            this.refName = this.name
        }
        else {
            this.refName = `${this.module}::${this.name}`
        }
    }

    /**
     * Return the type name (UpperCamel) of the element
     * referenced by a dependency.
     * 
     * @param dep A `$Dependency` instance
     * @param fromModule Name of dependant module
     * @returns The type name of the dependency
     */
    public static typeName(dep: $Dependency, fromModule: string) {
        if (dep.module !== fromModule) {
            const moduleHigh = NameHelpers.nameLowToHigh(dep.module);
            // WARN: this might break non-regular plural block names in the future
            const el_t = dep.type + 's';
            return `${moduleHigh}Module['${el_t}']['${dep.name}']`
        }
        else {
            return NameHelpers
                .names({ $t: dep.type, name: dep.name})
                .type;
        }
    }
}

/**
 * A element builder, along with metadata required for building it.
 * 
 * @category Engine
 */
export class BuilderNode {

    public module: string
    public type: BuilderType
    public name: string
    public tag: string
    public isInline?: boolean
    public filepath: string | string[]
    public dependencies: $Dependency[]
    public builder: AnyBuilder

    constructor($: {
        module: string,
        type: BuilderType,
        name: string,
        isInline?: boolean,
        filepath: string | string[],
        dependencies: $Dependency[],
        builder: AnyBuilder
    }) {
        this.module = $.module;
        this.type = $.type;
        this.name = $.name;
        this.tag = `${this.module}::${this.type}:${this.name}`;
        this.isInline = $.isInline;
        this.filepath = $.filepath;
        this.dependencies = $.dependencies;
        this.builder = $.builder;
    }
}

/**
 * A builder node with the dependencies resolved to references to other nodes.
 */
export type ResolvedBuilderNode = Overlay<BuilderNode, {

    // Used when calculating layers, has no meaning after
    _dependencies?: ResolvedBuilderNode[]

    // Created by `ModuleTree.resolveDependencies()`
    dependencies: { node: ResolvedBuilderNode, soft: boolean }[]
    inlines: {
        message?: Record<string, MessageBuilderNode>,
        job?: Record<string, JobBuilderNode | ResourceJobBuilderNode | MachineJobBuilderNode>
    }

    // Filled by ModuleTree.resolveGraph()
    // Only defined on inline nodes
    root?: ResolvedBuilderNode
    
    // Used by `ModuleTree.assembleLayers()`
    // It means the node has already been assigned to a layer, has no meaning after
    // the method is done
    layered?: boolean

    // Filled by `ModuleTree.buildLayers()`
    // When it calls each Builder.build() method passing the node
    schema?: AnyElementSchema

    // Filled by TSBridge (compiler stage 3)
    bridge?: {
        imports?: string[]
        extract?: BucketFnExtract | MessageFnExtract | JobFnExtract | MachineFnExtract
        appDependencies?: $Dependency[]
    }
}>