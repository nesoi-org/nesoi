import { $Module, $Space } from '~/schema';
import { $BlockOutput, $BlockType } from './block.schema';
import { MultiMessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { MessageTemplateFieldFactory } from '~/elements/entities/message/template/message_template_field.builder';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { $Dependency, BuilderNode } from '~/engine/dependency';
import { NameHelpers } from '~/compiler/helpers/name_helpers';


export abstract class BlockBuilder<
    Space extends $Space,
    Module extends $Module,
    Type extends $BlockType
> {

    protected _alias?: string;
    protected _authn: string[] = [];

    // References to all inline nodes, set during builder declaration (before build)
    protected _inlineNodes: BuilderNode[] = [];

    protected _inputMsgs: $Dependency[] = [];
    protected _output?: $BlockOutput;
    
    constructor(
        protected module: string,
        protected type: Type,
        protected name: string
    ) {}

    /** Block "human" name */
    public as(alias: string) {
        this._alias = alias;
        return this;
    }

    // Inline Messages

    /**
     * Inline messages. These messages are exposed to the module,
     * with a name prefixed by the block name.
     * @param def Example: `$ => { msg1: { prop1: $.int, prop2: $.string }, msg2: { prop3: $.boolean } }`
     * @returns 
     */
    protected messages<
        Def extends MultiMessageTemplateDef<Space, Module>
    >(def: Def) {
        const builder = new MessageTemplateFieldFactory<any, any, any>(this.module);
        const schema = def(builder);
        for (const key in schema) {
            const name = `${this.name}${key.length ? ('.'+key) : ''}`;
            this._inputMsgs.push(new $Dependency(this.module, 'message', name))
            const builder = new MessageBuilder<any,any,any>(this.module, name)
                .template(() => schema[key]);
            this._inlineNodes.push(new BuilderNode({
                module: this.module,
                type: 'message',
                name,
                builder,
                isInline: true,
                filepath: [], // This is added later by Treeshake.blockInlineNodes()
                dependencies: [] // This is added later by Treeshake.*()
            }));
        }
        return this as unknown;
    }

    // Authentication

    public authn(
        ...providers: string[]
    ) {
        if (!Array.isArray(providers)) {
            providers = [providers];
        }
        this._authn = providers as string[];
        return this as unknown;
    }

    // Input/Output

    protected _input(
        ...names: string[]
    ) {
        names.forEach((name: string) => {
            const fullName = NameHelpers.unabbrevName(name, this.name);
            const dep = new $Dependency(this.module, 'message', fullName)
            this._inputMsgs.push(dep);
        })
        return this as unknown;
    }   

    protected outputRaw() {
        return this as unknown;
    }

    protected outputMsg(
        ...msgs: string[]
    ) {
        this._output ??= {};
        this._output.msg ??= [];
        msgs.forEach(msg => {
            this._output?.msg?.push(new $Dependency(
                this.module,
                'message',
                msg,
                true
            ))
        })
        return this as unknown;
    }

    protected outputObj(
        ...objs: string[]
    ) {
        this._output ??= {};
        this._output.obj ??= [];
        objs.forEach(obj => {
            this._output?.obj?.push(new $Dependency(
                this.module,
                'bucket',
                obj as string,
                true
            ))
        })
        return this as unknown;
    }

}