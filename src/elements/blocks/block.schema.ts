import type { TypeAsObj } from '~/engine/util/type';
import type { $Message } from '~/elements/entities/message/message.schema';
import type { Tag } from '~/engine/dependency';

export type $BlockType = 'job' | 'resource' | 'machine' | 'queue' | 'topic'

export type $BlockOutput = {
    raw?: TypeAsObj
    msg?: Tag[]
    obj?: {
        tag: Tag
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
    public '#auth'!: {};
    public '#input'!: $Message;
    public '#output'!: unknown;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: Tag[],
        public output?: $BlockOutput
    ) {}
}
