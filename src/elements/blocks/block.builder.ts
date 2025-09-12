import { $Module, $Space } from '~/schema';
import { $BlockOutput, $BlockType } from './block.schema';
import { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { $Dependency, BuilderNode } from '~/engine/dependency';
import { NameHelpers } from '~/compiler/helpers/name_helpers';

/**
 * @category Builders
 * @subcategory Block
 */
export abstract class BlockBuilder<
    Space extends $Space,
    Module extends $Module,
    Type extends $BlockType
> {

    protected _alias?: string;
    protected _auth: {
        provider: string
        resolver?: (user: any) => boolean
    }[] = [];

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
     * Inline messages. This messages is exposed to the module,
     * with a name prefixed by the block name.
     * @param def A method which takes a field factory as input and outputs a template builder
     * @returns The Builder, for call-chaining
     */
    protected message<
        Name extends string,
        Def extends MessageTemplateDef<Space, Module, Name>
    >(name: Name, def: Def) {
        const msgName = `${this.name}${name.length ? ('.'+name) : ''}`;
        const builder = new MessageBuilder<any,any,any>(this.module, msgName)
            .template(def);
        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'message',
            name: msgName,
            builder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));

        return this as unknown;
    }

    // Authentication

    public auth<U extends keyof Space['authnUsers']>(
        provider: U,
        resolver?: (user: Space['authnUsers'][U]) => boolean
    ) {
        this._auth ??= [];
        
        // Replace by provider name
        const match = this._auth.findIndex(opt => opt.provider === provider as string);
        if (match >= 0) {
            this._auth.splice(match, 1);
        }

        this._auth.push({
            provider: provider as string,
            resolver
        })
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
            this._output!.msg!.push(new $Dependency(
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
            this._output?.obj?.push({
                dep: new $Dependency(
                    this.module,
                    'bucket',
                    obj as string,
                    true
                ),
                many: false
            })
        })
        return this as unknown;
    }

    protected outputObjs(
        ...objs: string[]
    ) {
        this._output ??= {};
        this._output.obj ??= [];
        objs.forEach(obj => {
            this._output?.obj?.push({
                dep: new $Dependency(
                    this.module,
                    'bucket',
                    obj as string,
                    true
                ),
                many: true
            })
        })
        return this as unknown;
    }

}