import type { $Module } from '~/schema';
import type { AnyBuilder, AnyElementSchema } from './module';
import type { Overlay } from './util/type';
import type { JobBuilderNode } from '~/elements/blocks/job/job.builder';
import type { MessageBuilderNode } from '~/elements/entities/message/message.builder';
import type { ResourceJobBuilderNode } from '~/elements/blocks/job/internal/resource_job.builder';
import type { MachineJobBuilderNode } from '~/elements/blocks/job/internal/machine_job.builder';
import type { ModuleTree } from './tree';
import type { AnyTrxNode} from './transaction/trx_node';

export type TagString = `${string}::${string}:${string}`
export type ShortTagString = `${string}::${string}`

export type TagType = 'constants' | 'constants.enum' | 'constants.value' | 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue' | 'topic' | 'externals'

/* @nesoi:browser ignore-start */
import type { AnyExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import type { tsScanResult, tsTypeScanResult } from '~/compiler/typescript/typescript_compiler';
/* @nesoi:browser ignore-end */

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
        const match = tag.match(/(.+)::(.+):(.+)/);
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
        const match = shortTag.match(/(.+)::(.*)/);
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
        const match = nameOrShortTag.match(/((.+)::)?(.*)/);
        
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

    //

    public static resolve(self: Tag, tree: ModuleTree): AnyElementSchema {
        const module = tree.modules[self.module];
        if (!module) {
            throw new Error(`Module ${self.module} is not an option to resolve the Tag`);
        }
        return this.resolveFrom(self, module.schema);
    }

    public static resolveFrom(self: Tag, module: $Module): AnyElementSchema {
        if (self.module !== module.name) {
            throw new Error(`Schema with tag ${self.full} does not belong to module ${module.name}`);
        }
        if (self.type === 'constants') return module.constants;
        if (self.type === 'constants.enum') return module.constants.enums[self.name];
        if (self.type === 'constants.value') return module.constants.values[self.name];
        if (self.type === 'externals') return module.externals;
        if (self.type === 'bucket') return module.buckets[self.name];
        if (self.type === 'message') return module.messages[self.name];
        if (self.type === 'job') return module.jobs[self.name];
        if (self.type === 'resource') return module.resources[self.name];
        if (self.type === 'machine') return module.machines[self.name];
        if (self.type === 'controller') return module.controllers[self.name];
        if (self.type === 'queue') return module.queues[self.name];
        if (self.type === 'topic') return module.topics[self.name];
        throw new Error(`Schema with tag ${self.full} not found on module ${module.name}`);
    }

    public static resolveExternal(self: Tag, externals: AnyExternalsBuilder): Dependency {
        if (self.type === 'constants.enum') {
            const enums = (externals as any).enums as AnyExternalsBuilder['enums'];
            return enums[self.short];
        }
        if (self.type === 'constants.value') {
            const values = (externals as any).values as AnyExternalsBuilder['values'];
            return values[self.short];
        }
        if (self.type === 'bucket') {
            const buckets = (externals as any).buckets as AnyExternalsBuilder['buckets'];
            return buckets[self.short];
        }
        if (self.type === 'message') {
            const messages = (externals as any).messages as AnyExternalsBuilder['messages'];
            return messages[self.short];
        }
        if (self.type === 'job') {
            const jobs = (externals as any).jobs as AnyExternalsBuilder['jobs'];
            return jobs[self.short];
        }
        if (self.type === 'machine') {
            const machines = (externals as any).machines as AnyExternalsBuilder['machines'];
            return machines[self.short];
        }
        const module = (externals as any).module as AnyExternalsBuilder['module'];
        throw new Error(`External tag ${self.full} not found on module ${module}`);
    }

    public static element(self: Tag, trx: AnyTrxNode) {
        const module = (trx as any).module as AnyTrxNode['module'];
        if (self.module !== module.name) {
            throw new Error(`Element with tag ${self.full} does not belong to module ${module.name}`);
        }
        if (self.type === 'constants') return module.schema.constants;
        if (self.type === 'constants.enum') return module.schema.constants.enums[self.name];
        if (self.type === 'constants.value') return module.schema.constants.values[self.name];
        if (self.type === 'externals') return module.schema.externals;
        if (self.type === 'bucket') return module.buckets[self.name];
        if (self.type === 'message') return module.messages[self.name];
        if (self.type === 'job') return module.jobs[self.name];
        if (self.type === 'resource') return module.resources[self.name];
        if (self.type === 'machine') return module.machines[self.name];
        if (self.type === 'controller') return module.controllers[self.name];
        if (self.type === 'queue') return module.queues[self.name];
        if (self.type === 'topic') return module.topics[self.name];
        throw new Error(`Element with tag ${self.full} not found on module ${module.name}`);
    }

    public static matches(self: Tag, other: Tag) {
        if (self.module !== other.module) return false;
        if (self.type !== other.type) return false;
        if (self.name !== other.name) return false;
        return true;
    }

    public static matchesSchema(self: Tag, schema: { $t: string, module: string, name: string }) {
        if (self.module !== schema.module) return false;
        if (self.type !== schema.$t) return false;
        if (self.name !== schema.name) return false;
        return true;
    }

    public static isSameNodeAs(self: Tag, other: Tag) {
        if (self.module !== other.module) return false;
        if (self.type === 'constants') {
            if (!other.type.startsWith('constants')) return false;
            return true;
        }
        if (other.type === 'constants') {
            if (!self.type.startsWith('constants')) return false;
            return true;
        }
        if (self.type !== other.type) return false;
        if (self.name !== other.name) return false;
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
        imports: string[]
        types: tsTypeScanResult
        nodes: tsScanResult
        appDependencies?: Dependency[]
    }
}>