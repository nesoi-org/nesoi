import type { $Module, $Space } from '~/schema';
import type { $BlockOutput, $BlockType } from './block.schema';
import type { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';

import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { BuilderNode, Dependency, Tag } from '~/engine/dependency';
import { NameHelpers } from '~/engine/util/name_helpers';

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

    protected _inputMsgs: Dependency[] = [];
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
            tag: new Tag(this.module, 'message', msgName),
            builder,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));

        return this as unknown;
    }

    // Authentication

    public auth<U extends keyof Space['users']>(
        provider: U,
        resolver?: (user: Space['users'][U]) => boolean
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
            const tag = Tag.fromNameOrShort(this.module, 'message', fullName);
            const dep = new Dependency(this.module, tag, { compile: true, runtime: true })
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
            
            const tag = Tag.fromNameOrShort(this.module, 'message', msg);
            const dep = new Dependency(this.module, tag, { compile: true, runtime: true })

            this._output!.msg!.push(dep.tag)
        })
        return this as unknown;
    }

    protected outputObj(
        ...objs: string[]
    ) {
        this._output ??= {};
        this._output.obj ??= [];
        objs.forEach(obj => {
            const tag = Tag.fromNameOrShort(this.module, 'bucket', obj);
            const dep = new Dependency(this.module, tag, { compile: true, runtime: true })
            this._output?.obj?.push({
                tag: dep.tag,
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
            const tag = Tag.fromNameOrShort(this.module, 'bucket', obj);
            const dep = new Dependency(this.module, tag, { compile: true, runtime: true })
            this._output?.obj?.push({
                tag: dep.tag,
                many: true
            })
        })
        return this as unknown;
    }

}