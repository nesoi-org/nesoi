import { TypeAsObj } from '~/compiler/elements/element';
import { $Message } from '~/elements/entities/message/message.schema';
import { AnyUsers } from '~/engine/auth/authn';
import { $Dependency } from '~/engine/dependency';

export type $BlockType = 'job' | 'resource' | 'machine' | 'queue'

export type $BlockOutput = {
    raw?: TypeAsObj
    msg?: $Dependency[]
    obj?: $Dependency[]
}

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Block {
    public $t: $BlockType = 'block' as any;
    public '#authn'!: AnyUsers;
    public '#input'!: $Message;
    public '#output'!: unknown;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public authn: string[],
        public input: $Dependency[],
        public output?: $BlockOutput
    ) {}
}