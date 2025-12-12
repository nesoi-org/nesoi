import { Element } from './element';
import { t } from '../types/type_compiler';
import type { $Job } from 'index';

export class JobElement extends Element<$Job> {

    // Schema

    protected prepare() {
        this.schema['#auth'] = Element.Never;
        this.schema['#input'] = Element.Never;
        this.schema['#output'] = Element.Never;
        this.schema['#extra'] = Element.Never;

        // ResourceJob
        if (this.schema.scope && 'resource' in this.schema.scope) {
            this.schema.method = {
                __fn: 'ResourceJob.method as (...args: any[]) => any',
                __fn_type: 'any'
            } as any
            if (
                this.schema.scope.prepareMethod.toString().startsWith('async prepareMsgData($) {') // TODO: improve this
            ) {
                this.schema.scope.prepareMethod = {
                    __fn: '($ => $.msg.getData()) as (...args: any[]) => any',
                    __fn_type: 'any'
                } as any
            }
            else if (
                this.schema.scope.prepareMethod.toString().startsWith('async prepareTrue() {') // TODO: improve this
            ) {
                this.schema.scope.prepareMethod = {
                    __fn: '($ => true) as (...args: any[]) => any',
                    __fn_type: 'boolean'
                } as any
            }
            this.schema.scope.execMethod = {
                __fn: `Resource.${this.schema.scope.method} as (...args: any[]) => any`,
                __fn_type: 'any'
            } as any
        }
    }

    protected customSchemaImports(nesoiPath: string): string {
        let imports = '';
        if (this.schema.scope && 'resource' in this.schema.scope) {
            imports += `import { Resource } from '${nesoiPath}/lib/elements/blocks/resource/resource';\n`;
            imports += `import { ResourceJob } from '${nesoiPath}/lib/elements/blocks/job/internal/resource_job';\n`;
        }
        return imports;
    }

    // Interface

    protected buildInterfaces() {

        this.interface
            .extends('$Job')
            .set({
                '#auth': this.makeAuthType(),
                '#input': this.makeInputType(),
                '#output': this.makeOutputType(),
                '#extra': this.makeExtraType(),
                module: t.literal(this.module),
                name: t.literal(this.schema.name),
                auth: this.makeAuthType(),
            })
    }

    protected makeExtraType() {
        // TODO
        const type = t.never();
        return type;
    }

}