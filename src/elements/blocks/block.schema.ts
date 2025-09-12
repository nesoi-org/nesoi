import { TypeAsObj } from '~/compiler/elements/element';
import { $Message } from '~/elements/entities/message/message.schema';
import { $Dependency } from '~/engine/dependency';

export type $BlockType = 'job' | 'resource' | 'machine' | 'queue' | 'topic'

export type $BlockOutput = {
    raw?: TypeAsObj
    msg?: $Dependency[]
    obj?: {
        dep: $Dependency
        many: boolean
    }[]
}

export type $BlockAuth = {
    provider: string
    resolver?: (user: Record<string, any>) => boolean
}

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Block {
    public $t: $BlockType = 'block' as any;
    public '#authn'!: {};
    public '#input'!: $Message;
    public '#output'!: unknown;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: $Dependency[],
        public output?: $BlockOutput
    ) {}
}
