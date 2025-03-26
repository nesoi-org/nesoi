import * as fs from 'fs';

import { Compiler } from './compiler';
import { CompilerError } from './error';
import { Module } from '~/engine/module';
import { NameHelpers } from './helpers/name_helpers';
import { MessageElement } from './elements/message.element';
import { BucketElement } from './elements/bucket.element';
import { JobElement } from './elements/job.element';
import { ResourceElement } from './elements/resource.element';
import { MachineElement } from './elements/machine.element';
import { ControllerElement } from './elements/controller.element';
import { ConstantsElement } from './elements/constants.element';
import { ExternalsElement } from './elements/externals.element';
import { ResolvedBuilderNode } from '~/engine/dependency';
import { Log, scopeTag } from '~/engine/util/log';
import { $Constants } from '~/elements/entities/constants/constants.schema';
import { $Externals } from '~/elements/blocks/externals/externals.schema';
import { $Message } from '~/elements/entities/message/message.schema';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { $Job } from '~/elements/blocks/job/job.schema';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
import { $Machine } from '~/elements/blocks/machine/machine.schema';
import { $Controller } from '~/elements/edge/controller/controller.schema';
import { $Module } from '~/schema';
import { $Queue } from '~/elements/blocks/queue/queue.schema';
import { QueueElement } from './elements/queue.element';
import { Element } from './elements/element';

export class CompilerModule {

    public lowName: string;
    public highName: string;
    public typeName: string;

    public module: Module<any, $Module>;
    public elements: Element<any>[] = [];

    constructor(
        public compiler: Compiler,
        name: string,
        path: string
    ) {
        this.lowName = name;
        this.highName = NameHelpers.nameLowToHigh(this.lowName);
        this.typeName = this.highName + 'Module';

        if (path && !fs.existsSync(path)) {
            throw CompilerError.DirectoryDoesntExists(path);
        }

        this.module = new Module(name, { path });
    }

    public async buildElementNode(
        node: ResolvedBuilderNode
    ) {
        Log.trace('compiler', 'module', `${this.lowName}::${scopeTag(node.type, node.name)} Compiling${node.isInline?' (inline)':''}`);

        // Entities
        if (node.type === 'constants') {
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
        
        if (node.type === 'externals') {
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

        if (node.type === 'message') {
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
        
        if (node.type === 'bucket') {
            const schema = node.schema as $Bucket;
            const el = new BucketElement(
                this.compiler,
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

        if (node.type === 'job') {
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

        if (node.type === 'resource') {
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

        if (node.type === 'machine') {
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

        if (node.type === 'controller') {
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

        if (node.type === 'queue') {
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
    }
    
}