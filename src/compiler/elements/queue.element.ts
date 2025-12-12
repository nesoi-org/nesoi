import { Element } from './element';
import { t } from '../types/type_compiler';
import type { $Queue } from 'index';

export class QueueElement extends Element<$Queue> {
  
    // Schema

    protected prepare() {
        this.schema['#auth'] = Element.Never;
        this.schema['#input'] = Element.Never;
        this.schema['#output'] = Element.Never;
    }

    // Interfaces

    protected buildInterfaces() {

        this.interface
            .extends('$Topic')
            .set({
                '#auth': this.makeAuthType(),
                '#input': this.makeInputType(),
                '#output': this.makeOutputType(),
                module: t.literal(this.module),
                name: t.literal(this.schema.name),
            })
    }


}