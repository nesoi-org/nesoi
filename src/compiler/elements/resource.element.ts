import { Element } from './element';
import { Tag } from '~/engine/dependency';
import type { TypeNode } from '../types/type_compiler';
import { t } from '../types/type_compiler';
import type { $Resource } from 'index';

export class ResourceElement extends Element<$Resource> {

    // Schema

    protected prepare() {
        this.schema['#auth'] = Element.Never;
        this.schema['#input'] = Element.Never;
        this.schema['#output'] = Element.Never;
        this.schema['#bucket'] = Element.Never;
        this.schema['#input.query'] = Element.Never;
        this.schema['#input.create'] = Element.Never;
        this.schema['#input.update'] = Element.Never;
        this.schema['#input.delete'] = Element.Never;
    }

    // Interfaces

    protected buildInterfaces() {

        let input_query = t.never() as TypeNode;
        if (this.schema.jobs.query) {
            input_query = t.schema(new Tag(this.module, 'message', this.schema.jobs.query.name));
        }
        let input_create = t.never() as TypeNode;
        if (this.schema.jobs.create) {
            input_create = t.schema(new Tag(this.module, 'message', this.schema.jobs.create.name));
        }
        let input_update = t.never() as TypeNode;
        if (this.schema.jobs.update) {
            input_update = t.schema(new Tag(this.module, 'message', this.schema.jobs.update.name));
        }
        let input_delete = t.never() as TypeNode;
        if (this.schema.jobs.delete) {
            input_delete = t.schema(new Tag(this.module, 'message', this.schema.jobs.delete.name));
        }

        const all_inputs = [
            input_query,
            input_create,
            input_update,
            input_delete,
        ]

        this.interface
            .extends('$Resource')
            .set({
                '#auth': this.makeAuthType(),
                '#input': t.union(all_inputs),
                '#output': this.makeOutputType(),
                '#bucket': t.schema(this.schema.bucket),
                '#input.query': input_query,
                '#input.create': input_create,
                '#input.update': input_update,
                '#input.delete': input_delete,
            })
    }

}