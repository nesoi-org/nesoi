import { $Module } from '~/schema';
import { AnyBuilder, AnyElementSchema } from './module';
import { Overlay } from './util/type';
import { JobBuilderNode } from '~/elements/blocks/job/job.builder';
import { MessageBuilderNode } from '~/elements/entities/message/message.builder';
import { ResourceJobBuilderNode } from '~/elements/blocks/job/internal/resource_job.builder';
import { BucketFnExtract, JobFnExtract, MachineFnExtract, MessageFnExtract } from '~/compiler/typescript/bridge/organize';
import { MachineJobBuilderNode } from '~/elements/blocks/job/internal/machine_job.builder';
import { ModuleTree } from './tree';
import { AnyExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import { AnyTrxNode, TrxNode } from './transaction/trx_node';

export type TagString = `${string}::${string}:${string}`
export type ShortTagString = `${string}::${string}`

export type TagType = 'constants' | 'constants.enum' | 'constants.value' | 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue' | 'topic' | 'externals'

/**
 * A tag references an element on a given module.
 * The short form can be used when the type is implicit.
 * 
 * module::type:name -> full tag
 * module::name      -> short tag
 * 
 * @category Engine
 */
export class Tag {

    public full: TagString
    public short: ShortTagString

    constructor(
        public module: string,
        public type: TagType,
        public name: string
    ) {
        this.full = `${module}::${type}:${name}`;
        this.short = `${module}::${name}`;
    }

    public static from(tag: TagString) {
        const match = tag.match(/(\w+)::([\w.]+):(\w*)/);
        const module = match?.[1]
        const type = match?.[2]
        const name = match?.[3]
        
        if (!match) {
            throw new Error(`Internal error: Invalid tag ${tag}`);
        }
        if (!module) {
            throw new Error(`Internal error: Invalid tag ${tag}, no module specified`);
        }
        if (!type) {
            throw new Error(`Internal error: Invalid tag ${tag}, no type specified`);
        }
        if (!name) {
            throw new Error(`Internal error: Invalid tag ${tag}, no name specified`);
        }
        if (module.includes(':')) {
            throw new Error(`Internal error: Invalid tag ${tag}, module ${module} includes invalid characters`);
        }
        if (type.includes(':')) {
            throw new Error(`Internal error: Invalid tag ${tag}, type ${type} includes invalid characters`);
        }
        if (name.includes(':')) {
            throw new Error(`Internal error: Invalid tag ${tag}, name ${name} includes invalid characters`);
        }
        
        // TODO: validate type?
        return new Tag(module, type as TagType, name);
    }

    public static fromShort(type: TagType, shortTag: ShortTagString) {
        const match = shortTag.match(/(\w+)::(\w*)/);
        const module = match?.[1]
        const name = match?.[2]
        
        if (!match) {
            throw new Error(`Internal error: Invalid short tag ${shortTag}`);
        }
        if (!module) {
            throw new Error(`Internal error: Invalid short tag ${shortTag}, no module specified`);
        }
        if (!name) {
            throw new Error(`Internal error: Invalid short tag ${shortTag}, no name specified`);
        }
        if (module.includes(':')) {
            throw new Error(`Internal error: Invalid short tag ${shortTag}, module ${module} includes invalid characters`);
        }
        if (name.includes(':')) {
            throw new Error(`Internal error: Invalid short tag ${shortTag}, name ${name} includes invalid characters`);
        }
        
        return new Tag(module, type, name);
    }

    public static fromNameOrShort(module: string, type: TagType, nameOrShortTag: string) {
        const match = nameOrShortTag.match(/((\w+)::)?(\w*)/);
        
        const tagModule = match?.[2]
        module = tagModule ?? module;
        const name = match?.[3]

        if (!match) {
            throw new Error(`Internal error: Invalid name or short tag ${nameOrShortTag}`);
        }
        if (!name) {
            throw new Error(`Internal error: Invalid name or short tag ${nameOrShortTag}, no name specified`);
        }
        if (name.includes(':')) {
            throw new Error(`Internal error: Invalid name or short tag ${nameOrShortTag}, name ${name} includes invalid characters`);
        }
        
        return new Tag(module, type, name);
    }
    
    public static get unsafe() {
        return __unsafe_Tag;
    }

    public resolve(tree: ModuleTree): AnyElementSchema {
        const module = tree.modules[this.module];
        if (!module) {
            throw new Error(`Module ${this.module} is not an option to resolve the Tag`);
        }
        return this.resolveFrom(module.schema);
    }

    public resolveFrom(module: $Module): AnyElementSchema {
        if (this.module !== module.name) {
            throw new Error(`Tag ${this.full} does not belong to module ${module.name}`);
        }
        if (this.type === 'constants') return module.constants;
        if (this.type === 'constants.enum') return module.constants.enums[this.name];
        if (this.type === 'constants.value') return module.constants.values[this.name];
        if (this.type === 'externals') return module.externals;
        if (this.type === 'bucket') return module.buckets[this.name];
        if (this.type === 'message') return module.messages[this.name];
        if (this.type === 'job') return module.jobs[this.name];
        if (this.type === 'resource') return module.resources[this.name];
        if (this.type === 'machine') return module.machines[this.name];
        if (this.type === 'controller') return module.controllers[this.name];
        throw new Error(`Tag ${this.full} not found on module ${module.name}`);
    }

    public resolveExternal(externals: AnyExternalsBuilder): Dependency {
        if (this.type === 'constants.enum') {
            const enums = (externals as any).enums as AnyExternalsBuilder['enums'];
            return enums[this.short];
        }
        if (this.type === 'constants.value') {
            const values = (externals as any).values as AnyExternalsBuilder['values'];
            return values[this.short];
        }
        if (this.type === 'bucket') {
            const buckets = (externals as any).buckets as AnyExternalsBuilder['buckets'];
            return buckets[this.short];
        }
        if (this.type === 'message') {
            const messages = (externals as any).messages as AnyExternalsBuilder['messages'];
            return messages[this.short];
        }
        if (this.type === 'job') {
            const jobs = (externals as any).jobs as AnyExternalsBuilder['jobs'];
            return jobs[this.short];
        }
        if (this.type === 'machine') {
            const machines = (externals as any).machines as AnyExternalsBuilder['machines'];
            return machines[this.short];
        }
        const module = (externals as any).module as AnyExternalsBuilder['module'];
        throw new Error(`External tag ${this.full} not found on module ${module}`);
    }


    public element(trx: AnyTrxNode) {
        const module = TrxNode.getModule(trx);
        if (this.module !== module.name) {
            throw new Error(`Tag ${this.full} does not belong to module ${module.name}`);
        }
        if (this.type === 'constants') return module.schema.constants;
        if (this.type === 'constants.enum') return module.schema.constants.enums[this.name];
        if (this.type === 'constants.value') return module.schema.constants.values[this.name];
        if (this.type === 'externals') return module.schema.externals;
        if (this.type === 'bucket') return module.buckets[this.name];
        if (this.type === 'message') return module.messages[this.name];
        if (this.type === 'job') return module.jobs[this.name];
        if (this.type === 'resource') return module.resources[this.name];
        if (this.type === 'machine') return module.machines[this.name];
        if (this.type === 'controller') return module.controllers[this.name];
        throw new Error(`Tag ${this.full} not found on module ${module.name}`);
    }

    public matches(other: Tag) {
        if (this.module !== other.module) return false;
        if (this.type !== other.type) return false;
        if (this.name !== other.name) return false;
        return true;
    }

    public isSameNodeAs(other: Tag) {
        if (this.module !== other.module) return false;
        if (this.type === 'constants') {
            if (!other.type.startsWith('constants')) return false;
            return true;
        }
        if (other.type === 'constants') {
            if (!this.type.startsWith('constants')) return false;
            return true;
        }
        if (this.name !== other.name) return false;
        return true;
    }

}
export class __unsafe_Tag {

    public static from(tag: TagString) {
        const match = tag.match(/(\w+)::([\w.]+):(\w*)/);
        const module = match?.[1]
        const type = match?.[2]
        const name = match?.[3]

        if (!match
            || !module
            || !type
            || !name
            || module.includes(':')
            || type.includes(':')
            || name.includes(':')
        ) {
            return undefined as any
        }
        // TODO: validate type?
        return new Tag(module, type as TagType, name);
    }

    public static fromShort(type: TagType, shortTag: ShortTagString) {
        const match = shortTag.match(/(\w+)::(\w*)/);
        const module = match?.[1]
        const name = match?.[2]

        if (!match
            || !module
            || !name
            || module.includes(':')
            || name.includes(':')
        ) {
            return undefined as any
        }
        return new Tag(module, type, name);
    }

    public static fromNameOrShort(module: string, type: TagType, nameOrShortTag: string) {
        const match = nameOrShortTag.match(/((\w+)::)?(\w*)/);
        
        const tagModule = match?.[1]
        module = tagModule ?? module;
        const name = match?.[3]

        if (!match
            || !name
            || name.includes(':')
        ) {
            return undefined as any
        }
        return new Tag(module, type, name);
    }

}

/**
 * A link between two elements.
 * 
 * @category Engine
 */
export class Dependency {
    
    public external: boolean
    public build: boolean
    public compile: boolean
    public runtime: boolean

    constructor(
        public fromModule: string,
        public tag: Tag,
        options?: {
            build?: boolean
            compile?: boolean
            runtime?: boolean
        }
    ) {
        this.external = tag.module !== fromModule;
        this.build = options?.build || false;
        this.compile = options?.compile || false;
        this.runtime = options?.runtime || false;
    }
}

// Compiler

/**
 * A element builder, along with metadata required for building it.
 * 
 * @category Engine
 */
export class BuilderNode {

    public tag: Tag
    public isInline?: boolean
    public filepath: string | string[]
    public dependencies: Dependency[]
    public builder: AnyBuilder
    public progressive?: {
        schema: AnyElementSchema
    }

    constructor($: {
        tag: Tag,
        isInline?: boolean,
        filepath: string | string[],
        dependencies: Dependency[],
        builder: AnyBuilder,
        progressive?: {
            schema: AnyElementSchema
        }
    }) {
        this.tag = $.tag;
        this.isInline = $.isInline;
        this.filepath = $.filepath;
        this.dependencies = $.dependencies;
        this.builder = $.builder;
        this.progressive = $.progressive;
    }
}

/**
 * A builder node with the dependencies resolved to references to other nodes.
 */
export type ResolvedBuilderNode = Overlay<BuilderNode, {

    // Used when resolving layers, has no meaning after
    _dependencies?: ResolvedBuilderNode[]

    // Created by `ModuleTree.resolveDependencies()`
    dependencies: { node: ResolvedBuilderNode, dep: Dependency }[]
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
        appDependencies?: Dependency[]
    }
}>