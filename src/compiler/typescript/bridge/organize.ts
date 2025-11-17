import * as ts from 'typescript';
import { Tag } from '~/engine/dependency';
import { tsFnQueryResult } from '../typescript_compiler';

export type tsFn = ts.FunctionExpression | ts.ArrowFunction
export type tsImport = ts.ImportDeclaration

export type BucketFnExtract = {
    views: {
        [name: string]: {
            computed: Record<string, tsFn>
            chain: Record<string, tsFn>
        }
    }
    tenancy: {
        [name: string]: tsFn
    }
}

export type MessageFnExtract = {
    rules: Record<string, tsFn[]>
}

export type JobFnExtract = {
    authResolver?: tsFn[]
    extrasAndAsserts?: ({ extra: tsFn } | { assert: tsFn })[]
    method?: tsFn
    prepare?: tsFn,
    after?: tsFn
    outputRaw?: string
}


export type ResourceFnExtract = {
    authResolver?: tsFn[]
}

export type MachineFnExtract = {
    states: {
        [name: string]: MachineStateFnExtract
    }
}

export type MachineStateFnExtract = {
    transitions?: {
        [msg: string]: MachineTransitionFnExtract[]
    }
}

export type MachineTransitionFnExtract = {
    if?: tsFn
}

export type OrganizedExtract = {
    buckets: Record<string, BucketFnExtract>,
    messages: Record<string, MessageFnExtract>,
    jobs: Record<string, JobFnExtract>,
    machines: Record<string, MachineFnExtract>,
    resources: Record<string, ResourceFnExtract>
}

export class TSBridgeOrganize {


    public static functions(
        types: {
            path: string,
            type: string
        }[] = [],
        functions: tsFnQueryResult[] = []
    ) {

        const organized: OrganizedExtract = {
            buckets: {},
            messages: {},
            jobs: {},
            machines: {},
            resources: {}
        }

        functions.forEach(fn => {
            const match = fn.path.match(/(\w+::\w+:.+?)▹(.+)/);
            if (!match) return;

            const [_, tag, path] = match;
            const { type } = Tag.from(tag as any);

            if (type === 'bucket') {
                this.bucket(organized, tag, path, fn.node);
            }
            else if (type === 'message') {
                this.message(organized, tag, path, fn.node);
            }
            else if (type === 'job') {
                this.job(organized, tag, path, fn.node);
            }
            else if (type === 'resource') {
                this.resource(organized, tag, path, fn.node);
            }
            else if (type === 'machine') {
                this.machine(organized, tag, path, fn.node);
            }
        })

        types.forEach(_type => {
            const match = _type.path.match(/(\w+::\w+:.+?)▹(.+)/);
            if (!match) return;

            const [_, tag, path] = match;
            const { type } = Tag.from(tag as any);

            if (type === 'job') {
                this.type_job(organized, tag, path, _type.type);
            }
        })

        return organized;
    }

    private static bucket(organized: OrganizedExtract, tag: string, path: string, node: tsFn) {
        const viewComputed = path.match(/view▹(\w+)▹1▹return▹([\w|\\.]+)▹computed▹0/);
        if (viewComputed) {
            const [_, view, prop] = viewComputed;
            organized.buckets[tag] ??= { views: {}, tenancy: {} }
            organized.buckets[tag].views[view] ??= { computed: {}, chain: {} }
            organized.buckets[tag].views[view].computed[prop] = node
            return
        }
        const viewTransform = path.match(/view▹(\w+)▹1▹return▹([\w|\\.]+)▹transform▹0/);
        if (viewTransform) {
            const [_, view, prop] = viewTransform;
            organized.buckets[tag] ??= { views: {}, tenancy: {} }
            organized.buckets[tag].views[view] ??= { computed: {}, chain: {} }
            organized.buckets[tag].views[view].chain[prop] = node
            return
        }
        const tenancy = path.match(/tenancy▹0▹(\w+)/);
        if (tenancy) {
            const [_, provider] = tenancy;
            organized.buckets[tag] ??= { views: {}, tenancy: {} };
            organized.buckets[tag].tenancy[provider] = node;
            return
        }
    }

    private static message(organized: OrganizedExtract, tag: string, path: string, node: tsFn) {
        const rule = path.match(/template▹0▹return▹(.+)▹rule▹0/);
        if (rule) {
            const [_, prop] = rule;
            let path = prop.replace(/▹obj▹0▹/g,'.');
            path = path.replace(/▹union▹/g,'.');
            path = path.replace(/▹list▹0/g,'.#');
            path = path.replace(/▹dict▹0/g,'.#');
            organized.messages[tag] ??= { rules: {} }
            organized.messages[tag].rules[path] ??= []
            organized.messages[tag].rules[path].push(node)
            return
        }
    }

    private static inlineMessage(organized: OrganizedExtract, parentTag: string, path: string, node: tsFn) {
        const message = path.match(/message▹(@|\w+)▹1▹return▹(.*)/);
        if (message) {
            const [_, inlineName, path] = message;
            const parent = Tag.from(parentTag as any);
            const msgName = inlineName === '@' ? parent.name : `${parent.name}.${inlineName}`;
            const msgTag = `${parent.module}::message:${msgName}`;
            const templatePath = `template▹0▹return▹${path}`;
            this.message(organized, msgTag, templatePath, node)
            return
        }
    }

    private static inputMessage(organized: OrganizedExtract, parentTag: string, path: string, node: tsFn) {
        const message = path.match(/input▹0▹return▹(.*)/);
        if (message) {
            const [_, path] = message;
            const parent = Tag.from(parentTag as any);
            const msgTag = `${parent.module}::message:${parent.name}`;
            const templatePath = `template▹0▹return▹${path}`;
            this.message(organized, msgTag, templatePath, node)
            return
        }
    }

    private static job(organized: OrganizedExtract, tag: string, path: string, node: tsFn) {
        this.inlineMessage(organized, tag, path, node);
        const authResolver = path.match(/auth▹.+▹1$/);
        if (authResolver) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].authResolver ??= [];
            organized.jobs[tag].authResolver!.push(node);
        }
        const extra = path.match(/extra▹0/);
        if (extra) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].extrasAndAsserts ??= []
            organized.jobs[tag].extrasAndAsserts!.push({ extra: node })
            return;
        }
        const assert = path.match(/assert▹0/);
        if (assert) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].extrasAndAsserts ??= []
            organized.jobs[tag].extrasAndAsserts!.push({ assert: node })
            return
        }
        const method = path.match(/method▹0/);
        if (method) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].method = node;
            return
        }
    }

    private static type_job(organized: OrganizedExtract, tag: string, path: string, type: string) {
        const raw = path.match(/output▹raw/);
        if (raw) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].outputRaw = type;
            return;
        }
    }

    private static resourceJob(organized: OrganizedExtract, tag: string, path: string, node: tsFn) {
        this.inputMessage(organized, tag, path, node);
        const authResolver = path.match(/auth▹.+▹1$/);
        if (authResolver) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].authResolver ??= [];
            organized.jobs[tag].authResolver!.push(node);
        }
        const extra = path.match(/extra▹0/);
        if (extra) {
            organized.jobs[tag] ??= {}
            organized.jobs[tag].extrasAndAsserts ??= []
            organized.jobs[tag].extrasAndAsserts!.push({ extra: node })
            return;
        }
        const assert = path.match(/assert▹0/);
        if (assert) {
            organized.jobs[tag] ??= { extrasAndAsserts: [] }
            organized.jobs[tag].extrasAndAsserts ??= []
            organized.jobs[tag].extrasAndAsserts!.push({ assert: node })
            return
        }
        const prepare = path.match(/prepare▹0/);
        if (prepare) {
            organized.jobs[tag] ??= { extrasAndAsserts: [] }
            organized.jobs[tag].prepare = node;
            return
        }
        const after = path.match(/after▹0/);
        if (after) {
            organized.jobs[tag] ??= { extrasAndAsserts: [] }
            organized.jobs[tag].after = node;
            return
        }
    }

    private static resource(organized: OrganizedExtract, tag: string, path: string, node: tsFn) {
        const job = path.match(/(create|update|delete)▹0▹return▹(.*)/);
        if (job) {
            const [_, method, path] = job;
            const resource = Tag.from(tag as any);
            const jobName = `${resource.name}.${method}`;
            const jobTag = `${resource.module}::job:${jobName}`;
            this.resourceJob(organized, jobTag, path, node);
            return
        }
        const authResolver = path.match(/auth▹.+▹1$/);
        if (authResolver) {
            organized.resources[tag] ??= {}
            organized.resources[tag].authResolver ??= [];
            organized.resources[tag].authResolver!.push(node);
        }
    }


    private static machine(organized: OrganizedExtract, tag: string, path: string, node: tsFn) {
        this.inlineMessage(organized, tag, path, node);

        const state = path.match(/((state▹\w+▹1▹return▹)+)(.*)/)
        if (state) {
            const [_, bigStatePath, _2, deepPath] = state;

            const statePath = bigStatePath.matchAll(/state▹(\w+)▹1▹return▹/g);

            const sName: string[] = []
            for (const p of statePath) sName.push(p[1]);
            const stateName = sName.join('.')

            this.machineState(organized, tag, stateName, deepPath, node);
            return
        }
    }

    private static machineState(organized: OrganizedExtract, machineTag: string, stateName: string, path: string, node: tsFn) {
        
        const machine = Tag.from(machineTag as any);

        const job = path.match(/(beforeEnter|afterEnter|beforeLeave|afterLeave)▹0▹return▹(.*)/)
        if (job) {
            const [_, moment, path] = job;
            const _moment = moment as 'beforeEnter'|'afterEnter'|'beforeLeave'|'afterLeave'
            const suffix = {
                beforeEnter: '__before_enter',
                afterEnter: '__after_enter',
                beforeLeave: '__before_leave',
                afterLeave: '__after_leave',
            }[_moment];
            const jobName = `${machine.name}@${stateName}${suffix}`;
            const jobTag = `${machine.module}::job:${jobName}`;
            this.job(organized, jobTag, path, node);
        }

        const beforeEnter = path.match(/beforeEnter▹0▹return/)
        if (beforeEnter) {
            const jobName = `${machine.name}@${stateName}__before_enter`;
            const jobTag = `${machine.module}::job:${jobName}`;
            this.job(organized, jobTag, path, node);
        }

        const afterEnter = path.match(/afterEnter▹0▹return/)
        if (afterEnter) {
            const jobName = `${machine.name}@${stateName}__after_enter`;
            const jobTag = `${machine.module}::job:${jobName}`;
            this.job(organized, jobTag, path, node);
        }

        const beforeLeave = path.match(/beforeLeave▹0▹return/)
        if (beforeLeave) {
            const jobName = `${machine.name}@${stateName}__before_leave`;
            const jobTag = `${machine.module}::job:${jobName}`;
            this.job(organized, jobTag, path, node);
        }

        const afterLeave = path.match(/afterLeave▹0▹return/)
        if (afterLeave) {
            const jobName = `${machine.name}@${stateName}__after_leave`;
            const jobTag = `${machine.module}::job:${jobName}`;
            this.job(organized, jobTag, path, node);
        }

        const transition = path.match(/transition▹([\w|\\.|@]+)▹1▹return▹(.*)/)
        if (transition) {
            const [_, msg, path] = transition;
            
            organized.machines[machineTag] ??= { states: {} }
            organized.machines[machineTag].states[stateName] ??= {}

            const extract = organized.machines[machineTag].states[stateName];
            this.machineTransition(organized, extract, machineTag, stateName, msg, path, node);
        }

    }

    private static machineTransition(organized: OrganizedExtract, extract: MachineFnExtract['states'][string], machineTag: string, stateName: string, msg: string, path: string, node: tsFn) {
        
        const machine = Tag.from(machineTag as any);
        if (msg.startsWith('@.')) {
            msg = msg.replace('@', machine.name);
        }

        const elses = path.matchAll(/else▹0▹return▹/g);
        let nElses = 0;
        for (const _ of elses) nElses++;

        extract.transitions ??= {}
        extract.transitions[msg] ??= []

        const trans = extract.transitions?.[msg];

        const condition = path.match(/if▹0$/)
        
        if (trans.length < nElses) {
            trans.push(...Array(nElses-trans.length).map(() => ({})))
        }
        
        if (condition) {
            trans.push({if: node});
        }

        const job = path.match(/runJob▹0▹return/)
        if (job) {
            const jobName = `${machine.name}@${stateName}~${msg}#${nElses}`;
            const jobTag = `${machine.module}::job:${jobName}`;
            this.job(organized, jobTag, path, node);
        }
    }
}