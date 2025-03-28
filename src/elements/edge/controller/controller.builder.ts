import { $Module, $Space } from '~/schema';
import { $Controller, $ControllerDomain, $ControllerEndpoint, $ControllerGroup } from './controller.schema';
import { $Message } from '~/elements/entities/message/message.schema';
import { $Dependency, ResolvedBuilderNode } from '~/engine/dependency';

type JobsSupportingMsg<
    M extends $Module,
    Msg extends $Message
> = {
    [J in keyof M['jobs']]: Msg extends M['jobs'][J]['#input'] ? J : never
}[keyof M['jobs']]

type ResourcesSupportingMsg<
    M extends $Module,
    Msg extends $Message
> = {
    [J in keyof M['resources']]: Msg extends M['resources'][J]['#input'] ? J : never
}[keyof M['resources']]

type MachinesSupportingMsg<
    M extends $Module,
    Msg extends $Message
> = {
    [J in keyof M['machines']]: Msg extends M['machines'][J]['#input'] ? J : never
}[keyof M['machines']]

export class ControllerEndpointBuilder<
    S extends $Space,
    M extends $Module,
    Msg extends $Message = never
> {

    private _alias?: string;
    private _tags: string[] = [];
    private _msg!: $Dependency;
    private _target!: $Dependency;
    
    constructor(
        private module: string,
        private name: string,
        private _authn: string[] = []
    ) {}

    as(alias: string) {
        this._alias = alias;
        return this;
    }

    public authn<
        U extends keyof S['authnUsers']
    >(providers: U | U[]) {
        if (!Array.isArray(providers)) {
            providers = [providers];
        }
        this._authn = providers as string[];
        return this;
    }

    tag(tag: string) {
        this._tags.push(tag);
        return this;
    }

    tags(tags: string[]) {
        this._tags.push(...tags);
        return this;
    }

    msg<K extends keyof M['messages']>(msg: K) {
        this._msg = new $Dependency(this.module, 'message', msg as string);
        return this as any as ControllerEndpointBuilder<S, M, M['messages'][K]>;
    }

    toJob(job: JobsSupportingMsg<M, Msg>) {
        this._target = new $Dependency(this.module, 'job', job as string);
        return this;
    }

    toResource(resource: ResourcesSupportingMsg<M, Msg>) {
        this._target = new $Dependency(this.module, 'resource', resource as string);
        return this;
    }

    toMachine(machine: MachinesSupportingMsg<M, Msg>) {
        this._target = new $Dependency(this.module, 'machine', machine as string);
        return this;
    }

    public static build(builder: ControllerEndpointBuilder<any, any>) {
        return new $ControllerEndpoint(
            builder.name,
            builder._alias || builder.name,
            builder._authn,
            builder._tags,
            builder._msg,
            builder._target
        );
    }
}

export class ControllerGroupBuilder<
    S extends $Space,
    M extends $Module
> {

    protected _alias?: string;
    protected groups: Record<string, ControllerGroupBuilder<any, any>> = {};
    protected endpoints: Record<string, ControllerEndpointBuilder<any, any>> = {};
    
    constructor(
        private module: string,
        protected name: string,
        protected _authn: string[] = []
    ) {}

    as(alias: string) {
        this._alias = alias;
        return this;
    }

    public authn<
        U extends keyof S['authnUsers']
    >(providers: U | U[]) {
        if (!Array.isArray(providers)) {
            providers = [providers];
        }
        this._authn = providers as string[];
        return this;
    }

    public endpoint(name: string, $: ControllerEndpointDef<S, M>) {
        const builder = new ControllerEndpointBuilder(this.module, name, this._authn);
        $(builder as any);
        this.endpoints[name] = builder;
        return this;
    }
    
    public group(name: string, $: ControllerGroupDef<S, M>) {
        const builder = new ControllerGroupBuilder(this.module, name, this._authn);
        $(builder as any);
        this.groups[name] = builder;
        return this;
    }

    public static build(builder: ControllerGroupBuilder<any, any>) {
        const endpoints = this.buildEndpoints(builder.endpoints);
        const groups = this.buildGroups(builder.groups);
        return new $ControllerGroup(
            builder.name,
            builder._alias || builder.name,
            builder._authn,
            groups,
            endpoints
        );
    }

    public static buildGroups(builders: Record<string, ControllerGroupBuilder<any, any>>) {
        const groups = {} as Record<string, $ControllerGroup>;
        for (const g in builders) {
            const group = builders[g];
            groups[g] = this.build(group);
        }
        return groups; 
    }

    public static buildEndpoints(builders: Record<string, ControllerEndpointBuilder<any, any>>) {
        const endpoints = {} as Record<string, $ControllerEndpoint>;
        for (const g in builders) {
            const endpoint = builders[g];
            endpoints[g] = ControllerEndpointBuilder.build(endpoint);
        }
        return endpoints; 
    }

}

export class ControllerDomainBuilder<
    S extends $Space,
    M extends $Module
> extends ControllerGroupBuilder<S,M> {

    private _version = 'v1';

    public version(version: string) {
        this._version = version;
        return this;
    }

    public static build(builder: ControllerDomainBuilder<any, any>) {
        const group = ControllerGroupBuilder.build(builder);
        return new $ControllerDomain(
            group.name,
            group.alias,
            group.authn,
            builder._version,
            group.groups,
            group.endpoints
        );
    }
}

export class ControllerBuilder<
    S extends $Space,
    M extends $Module
> {
    public $b = 'controller' as const;

    private _alias?: string;
    private _authn: string[] = [];
    private domains: Record<string, ControllerDomainBuilder<S,M>> = {};

    constructor(
        private module: string,
        private name: string
    ) {}

    public as(alias: string) {
        this._alias = alias;
        return this;
    }

    public authn<
        U extends keyof S['authnUsers']
    >(providers: U | U[]) {
        if (!Array.isArray(providers)) {
            providers = [providers];
        }
        this._authn = providers as string[];
        return this;
    }

    public domain(name: string, $: ControllerDomainDef<S, M>) {
        const builder = new ControllerDomainBuilder(this.module, name, this._authn);
        $(builder as any);
        const version = (builder as any)._version as ControllerDomainBuilder<any, any>['_version'];
        this.domains[name+'.'+version] = builder as any;
        return this;
    }

    // Build

    public static build(node: ControllerBuilderNode) {
        const domains = this.buildDomains(node.builder.domains);
        const input = Object.values(domains)
            .map(domain => this.buildInput(domain))
            .flat();
        node.schema = new $Controller(
            node.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._authn,
            input,
            domains
        );
        return node.schema;
    }

    public static buildInput(group: $ControllerGroup) {
        const input = [] as $Dependency[];
        for (const e in group.endpoints) {
            const endpoint = group.endpoints[e];
            input.push(endpoint.msg);
        }
        for (const e in group.groups) {
            const groupInput = this.buildInput(group.groups[e]);
            input.push(...groupInput);
        }
        return input;
    }

    public static buildDomains(builders: Record<string, ControllerDomainBuilder<any, any>>) {
        const domains = {} as Record<string, $ControllerDomain>;
        for (const g in builders) {
            const domain = builders[g];
            domains[g] = ControllerDomainBuilder.build(domain);
        }
        return domains; 
    }
}

type ControllerEndpointDef<
    S extends $Space,
    M extends $Module
> = ($: ControllerEndpointBuilder<S, M>) => ControllerEndpointBuilder<S, M, any>

type ControllerGroupDef<
    S extends $Space,
    M extends $Module
> = ($: ControllerGroupBuilder<S, M>) => ControllerGroupBuilder<S, M>

type ControllerDomainDef<
    S extends $Space,
    M extends $Module
> = ($: ControllerDomainBuilder<S, M>) => ControllerDomainBuilder<S, M>

export type AnyControllerBuilder = ControllerBuilder<any, any>

export type ControllerBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyControllerBuilder,
    schema?: $Controller
}