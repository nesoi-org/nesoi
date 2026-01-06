import { Element } from './element';
import { NameHelpers } from '~/engine/util/name_helpers';
import { t, TypeInterface, TypeNamespace } from '../types/type_compiler';

export class ControllerElement extends Element<$Controller> {

    // Schema

    protected prepare() {
        this.schema['#auth'] = Element.Never;
        this.schema['#input'] = Element.Never;
    }

    // Interface

    public buildInterfaces() {
        this.child_namespace =
            new TypeNamespace(this.highName + 'Controller');

        const domains = this.makeDomains();
        this.child_namespace.add(...domains.interfaces);
        
        const topics = this.makeTopics();
        this.child_namespace.add(...topics.interfaces);
        
        this.interface
            .extends('$Controller')
            .set({
                '#auth': this.makeAuthType(),
                '#input': this.makeInputType(),
                module: t.literal(this.module),
                name: t.literal(this.lowName),
                domains: domains.type,
                topics: topics.type,
            })
    }

    // [Makers]

    private makeDomains() {
        const interfaces: TypeInterface[] = [];
        const type = t.obj({});

        Object.entries(this.schema.domains).map(([key, domain]) => {
            const name = NameHelpers.nameLowToHigh(domain.name);
            
            const groups = this.makeGroups(name, domain.groups);
            interfaces.push(...groups.interfaces);

            const _interface = new TypeInterface(`${name}Domain`)
                .extends('$ControllerDomain')
                .set({
                    name: t.literal(domain.name),
                    // auth: this.makeAuthType(domain.auth),
                    groups: groups.type
                })

            type.children[key] = t.ref(this.child_namespace!, _interface.name);
            interfaces.push(_interface);
        })
        
        return { interfaces, type }
    }

    private makeGroups(parent: string, schemas: Record<string, $ControllerGroup>) {
        const interfaces: TypeInterface[] = [];
        const type = t.obj({});
        
        Object.entries(schemas).map(([key, group]) => {
            const name = parent + NameHelpers.nameLowToHigh(group.name);           

            const groups = this.makeGroups(name, group.groups);
            interfaces.push(...groups.interfaces);
            
            const endpoints = this.makeEndpoints(name, group.endpoints);
            interfaces.push(...endpoints.interfaces);

            const _interface = new TypeInterface(`${name}Group`)
                .extends('$ControllerGroup')
                .set({
                    name: t.literal(group.name),
                    // auth: this.makeAuthType(group.auth),
                    groups: groups.type,
                    endpoints: endpoints.type
                })
            type.children[key] = t.ref(_interface.name);
            interfaces.push(_interface);
        })
        
        return { interfaces, type }
    }

    private makeEndpoints(parent: string, schemas: Record<string, $ControllerEndpoint>) {
        const interfaces: TypeInterface[] = [];
        const type = t.obj({});
        
        Object.entries(schemas).map(([key, endpoint]) => {
            const name = parent + NameHelpers.nameLowToHigh(endpoint.name);           

            const _interface = new TypeInterface(`${name}Endpoint`)
                .extends('$ControllerEndpoint')
                .set({
                    name: t.literal(endpoint.name),
                    // auth: this.makeAuthType(endpoint.auth),
                    tags: t.list(t.union(endpoint.tags.map(tag => t.literal(tag)))),
                    idempotent: t.ref(endpoint.idempotent ? 'true' : 'false')
                })

            type.children[key] = t.ref(_interface.name);
            interfaces.push(_interface);
        })
        
        return { interfaces, type }
    }

    private makeTopics() {
        const interfaces: TypeInterface[] = [];
        const type = t.obj({});

        Object.entries(this.schema.topics).map(([key, topic]) => {
            const name = NameHelpers.nameLowToHigh(topic.name);
            
            const _interface = new TypeInterface(`${name}Topic`)
                .extends('$ControllerTopic')
                .set({
                    name: t.literal(topic.name),
                    // auth: this.makeAuthType(topic.auth),
                    tags: t.list(t.union(topic.tags.map(tag => t.literal(tag)))),
                })

            type.children[key] = t.ref(this.child_namespace!, _interface.name);
            interfaces.push(_interface);
        })
        
        return { interfaces, type }
    }

}