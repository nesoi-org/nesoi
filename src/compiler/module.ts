import type { Compiler } from './compiler';
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { $Constants } from '~/elements/entities/constants/constants.schema';
import type { $Externals } from '~/elements/edge/externals/externals.schema';
import type { $Message } from '~/elements/entities/message/message.schema';
import type { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import type { $Job } from '~/elements/blocks/job/job.schema';
import type { $Resource } from '~/elements/blocks/resource/resource.schema';
import type { $Machine } from '~/elements/blocks/machine/machine.schema';
import type { $Controller } from '~/elements/edge/controller/controller.schema';
import type { $Module } from '~/schema';
import type { $Queue } from '~/elements/blocks/queue/queue.schema';
import type { Element } from './elements/element';
import type { $Topic } from '~/elements';

import * as fs from 'fs';
import { CompilerError } from './error';
import { Module } from '~/engine/module';
import { NameHelpers } from '~/engine/util/name_helpers';
import { MessageElement } from './elements/message.element';
import { BucketElement } from './elements/bucket.element';
import { JobElement } from './elements/job.element';
import { ResourceElement } from './elements/resource.element';
import { MachineElement } from './elements/machine.element';
import { ControllerElement } from './elements/controller.element';
import { ConstantsElement } from './elements/constants.element';
import { ExternalsElement } from './elements/externals.element';
import { Log, scopeTag } from '~/engine/util/log';
import { QueueElement } from './elements/queue.element';
import { CachedElement } from './elements/cached.element';
import { TopicElement } from './elements/topic.element';
import type { BucketTypeCompiler } from './types/bucket.type_compiler';

export class CompilerModule {

    public lowName: string;
    public highName: string;
    public typeName: string;

    public module: Module<any, $Module>;
    public elements: Element<any>[] = [];

    constructor(
        public compiler: Compiler,
        name: string,
        path: string,
        subdir: string[] = []
    ) {
        this.lowName = name;
        this.highName = NameHelpers.nameLowToHigh(this.lowName);
        this.typeName = this.highName + 'Module';

        if (path && !fs.existsSync(path)) {
            throw CompilerError.DirectoryDoesntExists(path);
        }

        this.module = new Module(name, { dirpath: path }, subdir);
    }

    public async buildElementNode(
        node: ResolvedBuilderNode,
        bucket_types: BucketTypeCompiler
    ) {
        Log.trace('compiler', 'module', `${this.lowName}::${scopeTag(node.tag.type, node.tag.name)} Compiling${node.isInline?' (inline)':''}`);

        // Progressive (Cached)
        if (node.progressive) {
            const el = new CachedElement(
                this.compiler,
                node
            );
            this.elements.push(el);
            return el;
        }

        // Entities
        if (node.tag.type === 'constants') {
            const el = new ConstantsElement(
                this.compiler,
                this.lowName,
                'constants',
                node.filepath as string[],
                node.schema as $Constants,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }
        
        if (node.tag.type === 'externals') {
            const el = new ExternalsElement(
                this.compiler,
                this.lowName,
                'externals',
                node.filepath as string[],
                node.schema as $Externals,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }

        if (node.tag.type === 'message') {
            const schema = node.schema as $Message;
            const el = new MessageElement(
                this.compiler,
                this.lowName,
                'message',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                node.root,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }
        
        if (node.tag.type === 'bucket') {
            const schema = node.schema as $Bucket;
            const el = new BucketElement(
                this.compiler,
                bucket_types,
                this.lowName,
                'bucket',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }
        
        // Blocks

        if (node.tag.type === 'job') {
            const schema = node.schema as $Job;
            const el = new JobElement(
                this.compiler,
                this.lowName,
                'job',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                node.root,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }

        if (node.tag.type === 'resource') {
            const schema = node.schema as $Resource;
            const el = new ResourceElement(
                this.compiler,
                this.lowName,
                'resource',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }

        if (node.tag.type === 'machine') {
            const schema = node.schema as $Machine;
            const el = new MachineElement(
                this.compiler,
                this.lowName,
                'machine',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }

        // Edge

        if (node.tag.type === 'controller') {
            const schema = node.schema as $Controller;
            const el = new ControllerElement(
                this.compiler,
                this.lowName,
                'controller',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }

        if (node.tag.type === 'queue') {
            const schema = node.schema as $Queue;
            const el = new QueueElement(
                this.compiler,
                this.lowName,
                'queue',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }

        if (node.tag.type === 'topic') {
            const schema = node.schema as $Topic;
            const el = new TopicElement(
                this.compiler,
                this.lowName,
                'topic',
                [node.filepath as string],
                schema,
                node.dependencies.map(dep => dep.node),
                undefined,
                node.bridge
            );
            this.elements.push(el);
            return el;
        }
    }
    
}