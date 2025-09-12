import { Element } from './element';
import { $Job } from '~/elements/blocks/job/job.schema';
import { DumpHelpers } from '../helpers/dump_helpers';
import { ResourceJob } from '~/elements/blocks/job/internal/resource_job';

export class JobElement extends Element<$Job> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = this.schema.input.length ? Element.Any : Element.Never;
        this.schema['#output'] = Element.Any;
        this.schema['#extra'] = Element.Any;

        // ResourceJob
        if (this.schema.scope && 'resource' in this.schema.scope) {
            this.schema.method = {
                __fn: 'ResourceJob.method as (...args: any[]) => any',
                __fn_type: 'any' // TODO: evaluate
            } as any
            if (
                this.schema.scope.prepareMethod == ResourceJob.prepareMsgData
            ) {
                this.schema.scope.prepareMethod = {
                    __fn: '($ => $.msg.getData()) as (...args: any[]) => any',
                    __fn_type: 'any' // TODO: evaluate
                } as any
            }
            else if (
                this.schema.scope.prepareMethod == ResourceJob.prepareTrue
            ) {
                this.schema.scope.prepareMethod = {
                    __fn: '($ => true) as (...args: any[]) => any',
                    __fn_type: 'boolean' // TODO: evaluate
                } as any
            }
            this.schema.scope.execMethod = {
                __fn: `Resource.${this.schema.scope.method} as (...args: any[]) => any`,
                __fn_type: 'any' // TODO: evaluate
            } as any
        }
    }

    protected customImports(nesoiPath: string): string {
        let imports = '';
        if (this.schema.scope && 'resource' in this.schema.scope) {
            imports += `import { Resource } from '${nesoiPath}/lib/elements/blocks/resource/resource';\n`;
            imports += `import { ResourceJob } from '${nesoiPath}/lib/elements/blocks/job/internal/resource_job';\n`;
        }
        return imports;
    }

    protected buildType() {
        const { input, output } = Element.makeIOType(this.compiler, this.schema);
        const type = DumpHelpers.dumpValueToType(this.schema, {
            extrasAndAsserts: () => 'any',
            method: () => 'any',
            output: () => 'any'
        })
        Object.assign(type, {
            'input': 'any',
            '#authn': Element.makeAuthnType(this.schema.auth),
            '#input': input,
            '#output': output,
            '#extra': 'any // TODO: Typescript API'
        });
        return type;
    }

}