import type { TypeNode } from '../types/type_compiler';
import { t, TypeInterface } from '../types/type_compiler';
import { Tag } from '~/engine/dependency';

export class ModuleTypeCompiler {
  

    constructor(
        private schema: $Module
    ) {

    }

    public compile(space: string) {
        const constants = this.makeConstants();

        const messages = this.makeMessages();
        const buckets = this.makeBuckets();
        const jobs = this.makeJobs();
        const resources = this.makeResources();
        const machines = this.makeMachines();
        const controllers = this.makeControllers();
        const queues = this.makeQueues();
        const topics = this.makeTopics();

        const externals = this.makeExternals();
        Object.assign(buckets.children, externals.buckets);
        Object.assign(messages.children, externals.messages);
        Object.assign(jobs.children, externals.jobs);
        Object.assign(machines.children, externals.machines);

        return new TypeInterface('Module')
            .extends('$Module')
            .set({
                '#auth': t.ref(`${space}['users']`),
                '#input': t.union(Object.values(messages.children)),
                name: t.literal(this.schema.name),
                constants,
                messages,
                buckets,
                jobs,
                resources,
                machines,
                controllers,
                queues,
                topics
            })
    }

    private makeConstants() {
        if (
            Object.keys(this.schema.constants.values).length
            || Object.keys(this.schema.constants.enums).length
        )
            return t.ref('Constants');
        return t.never();
    }

    private makeExternals() {
        const buckets: Record<string, TypeNode> = {};
        const messages: Record<string, TypeNode> = {};
        const jobs: Record<string, TypeNode> = {};
        const machines: Record<string, TypeNode> = {};

        Object.entries(this.schema.externals.buckets).forEach(([short, tag]) => {
            buckets[short] = t.schema(tag)
        })
        Object.entries(this.schema.externals.messages).forEach(([short, tag]) => {
            messages[short] = t.schema(tag)
        })
        Object.entries(this.schema.externals.jobs).forEach(([short, tag]) => {
            jobs[short] = t.schema(tag)
        })
        Object.entries(this.schema.externals.machines).forEach(([short, tag]) => {
            machines[short] = t.schema(tag)
        })

        return {
            buckets,
            messages,
            jobs,
            machines
        }
    }

    private makeMessages() {
        const type = t.obj({});
        Object.entries(this.schema.messages).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'message', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeBuckets() {
        const type = t.obj({});
        Object.entries(this.schema.buckets).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'bucket', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeJobs() {
        const type = t.obj({});
        Object.entries(this.schema.jobs).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'job', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeResources() {
        const type = t.obj({});
        Object.entries(this.schema.resources).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'resource', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeMachines() {
        const type = t.obj({});
        Object.entries(this.schema.machines).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'machine', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeControllers() {
        const type = t.obj({});
        Object.entries(this.schema.controllers).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'controller', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeQueues() {
        const type = t.obj({});
        Object.entries(this.schema.queues).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'queue', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }

    private makeTopics() {
        const type = t.obj({});
        Object.entries(this.schema.topics).map(([key, value]) => {
            const tag = new Tag(this.schema.name, 'topic', value.name)
            type.children[key] = t.schema(tag);
        })
        return type;
    }


}