import type { MessageBuilderNode } from '~/elements/entities/message/message.builder';
import type { BucketBuilderNode } from '~/elements/entities/bucket/bucket.builder';
import type { ResourceBuilderNode } from '~/elements/blocks/resource/resource.builder';
import type { MachineBuilderNode } from '~/elements/blocks/machine/machine.builder';
import type { JobBuilderNode } from '~/elements/blocks/job/job.builder';
import type { ConstantsBuilderNode } from '~/elements/entities/constants/constants.builder';
import type { ControllerBuilderNode } from '~/elements/edge/controller/controller.builder';
import type { ExternalsBuilderNode } from '~/elements/edge/externals/externals.builder';
import type { ResolvedBuilderNode } from './dependency';
import type { ModuleTree } from './tree';
import type { QueueBuilderNode } from '~/elements/blocks/queue/queue.builder';
import type { TopicBuilderNode } from '~/elements/blocks/topic/topic.builder';
import type { AnyModule } from './module';
import type { $Message, $Job } from '~/elements';

import { Log, scopeTag } from './util/log';
import { NesoiError } from './data/error';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { ResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import { MachineBuilder } from '~/elements/blocks/machine/machine.builder';
import { JobBuilder } from '~/elements/blocks/job/job.builder';
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';
import { ControllerBuilder } from '~/elements/edge/controller/controller.builder';
import { ExternalsBuilder } from '~/elements/edge/externals/externals.builder';
import { QueueBuilder } from '~/elements/blocks/queue/queue.builder';
import { TopicBuilder } from '~/elements/blocks/topic/topic.builder';

export class Builder {
    
    // Build Nodes
    
    /**
     * Build a resolved builder node, then merge the 
     * resulting schema(s) to the module.
     * This also merges the resulting inline nodes of building a node.
     * 
     * @param node A resolved builder node
     * @param tree A module tree
     */
    static buildNode(module: AnyModule, node: ResolvedBuilderNode, tree: ModuleTree) {
        Log.trace('builder', 'module', `Building ${module.name}::${scopeTag(node.builder.$b as any,(node.builder as any).name)}`);
        
        if (node.builder.$b === 'constants') {
            module.schema.constants = ConstantsBuilder.build(node as ConstantsBuilderNode);
        }
        else if (node.builder.$b === 'externals') {
            module.schema.externals = ExternalsBuilder.build(node as ExternalsBuilderNode, tree);
        }
        else if (node.builder.$b === 'bucket') {
            module.schema.buckets[node.tag.name] = BucketBuilder.build(node as BucketBuilderNode, tree);
        }
        else if (node.builder.$b === 'message') {
            module.schema.messages[node.tag.name] = MessageBuilder.build(node as MessageBuilderNode, tree,module.schema);
        }
        else if (node.builder.$b === 'job') {
            const { schema, inlineMessages } = JobBuilder.build(node as JobBuilderNode, tree, module.schema);
            module.schema.jobs[node.tag.name] = schema;
            this.mergeInlineMessages(module, inlineMessages);
        }
        else if (node.builder.$b === 'resource') {
            const { schema, inlineMessages, inlineJobs } = ResourceBuilder.build(node as ResourceBuilderNode, tree, module.schema);
            module.schema.resources[schema.name] = schema;
            this.mergeInlineMessages(module, inlineMessages);
            this.mergeInlineJobs(module, inlineJobs);
        }
        else if (node.builder.$b === 'machine') {
            const { schema, inlineMessages, inlineJobs } = MachineBuilder.build(node as MachineBuilderNode, tree, module.schema);
            module.schema.machines[schema.name] = schema;
            this.mergeInlineMessages(module, inlineMessages);
            this.mergeInlineJobs(module, inlineJobs);
        }
        else if (node.builder.$b === 'controller') {
            module.schema.controllers[node.tag.name] = ControllerBuilder.build(node as ControllerBuilderNode);
        }
        else if (node.builder.$b === 'queue') {
            const { schema, inlineMessages } = QueueBuilder.build(node as QueueBuilderNode, tree, module.schema);
            module.schema.queues[node.tag.name] = schema;
            this.mergeInlineMessages(module, inlineMessages);
        }
        else if (node.builder.$b === 'topic') {
            const { schema, inlineMessages } = TopicBuilder.build(node as TopicBuilderNode, tree, module.schema);
            module.schema.topics[node.tag.name] = schema;
            this.mergeInlineMessages(module, inlineMessages);
        }
        else {
            throw NesoiError.Module.UnknownBuilderType(module, node.filepath.toString(), node.tag.name, (node.builder as any).$b);
        }
    }


    /**
     * Merge inline message schemas into the module.
     * 
     * @param node A resolved builder node
     * @param schemas A dictionary of Message schemas by name
     */
    private static mergeInlineMessages(module: AnyModule, schemas: Record<string, $Message>) {
        for (const name in schemas) {
            const $msg = schemas[name];
            module.schema.messages[name] = $msg;
        }
    }

    /**
     * Merge inline job schemas into the module.
     * 
     * @param node A resolved builder node
     * @param schemas A dictionary of job schemas by name
     */
    private static mergeInlineJobs(module: AnyModule, schemas: Record<string, $Job>) {
        for (const name in schemas) {
            const $job = schemas[name];
            module.schema.jobs[name] = $job;
        }
    }

}