import { Element } from './element';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
import { NameHelpers } from '~/engine/util/name_helpers';
import { DumpHelpers } from '../helpers/dump_helpers';

export class ResourceElement extends Element<$Resource> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = this.schema.input.length ? Element.Any : Element.Never;
        this.schema['#output'] = Element.Never;
        this.schema['#bucket'] = Element.Any;
        this.schema['#input.view'] = this.schema.jobs.view ? Element.Any : Element.Never;
        this.schema['#input.query'] = this.schema.jobs.query ? Element.Any : Element.Never;
        this.schema['#input.create'] = this.schema.jobs.create ? Element.Any : Element.Never;
        this.schema['#input.update'] = this.schema.jobs.update ? Element.Any : Element.Never;
        this.schema['#input.delete'] = this.schema.jobs.delete ? Element.Any : Element.Never;
    }

    protected buildType() {

        const bucketName = NameHelpers.tagType(this.schema.bucket, this.module);

        const input: Record<string, string> = {};
        if (this.schema.jobs.view) {
            const msg = this.schema.jobs.view.resolve(this.compiler.tree);
            const msgName = NameHelpers.names({ $t: 'message', name: msg.name });
            input.view = msgName.type;
        }
        if (this.schema.jobs.query) {
            const msg = this.schema.jobs.query.resolve(this.compiler.tree);
            const msgName = NameHelpers.names({ $t: 'message', name: msg.name });
            input.query = msgName.type;
        }
        if (this.schema.jobs.create) {
            const msg = this.schema.jobs.create.resolve(this.compiler.tree);
            const msgName = NameHelpers.names({ $t: 'message', name: msg.name });
            input.create = msgName.type;
        }
        if (this.schema.jobs.update) {
            const msg = this.schema.jobs.update.resolve(this.compiler.tree);
            const msgName = NameHelpers.names({ $t: 'message', name: msg.name });
            input.update = msgName.type;
        }
        if (this.schema.jobs.delete) {
            const msg = this.schema.jobs.delete.resolve(this.compiler.tree);
            const msgName = NameHelpers.names({ $t: 'message', name: msg.name });
            input.delete = msgName.type;
        }

        const allInputs = Object.values(input);

        return DumpHelpers.dumpValueToType(this.schema, {
            '#authn': () => Element.makeAuthnType(this.schema.authn),
            '#input': () => allInputs.length ? allInputs.join(' | ') : 'never',
            '#output': () => 'never',
            '#bucket': () => bucketName,
            '#input.view': () => input.view ?? 'never',
            '#input.query': () => input.query ?? 'never',
            '#input.create': () => input.create ?? 'never',
            '#input.update': () => input.update ?? 'never',
            '#input.delete': () => input.delete ?? 'never'
        });
    }

    protected buildCreate() {

    }

}