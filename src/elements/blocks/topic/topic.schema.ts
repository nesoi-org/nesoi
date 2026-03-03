import type { Tag  } from '~/engine/dependency';
import type { $BlockOutput , $BlockAuth } from '../block.schema';

import { $Block } from '../block.schema';
import type { User } from '~/engine/auth/authn';
import type { AnyMessage } from '~/elements/entities/message/message';

export type $TopicCensor = {
    provider: string
    transform: (msg: AnyMessage, user: User) => Record<string, any>
}

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Topic extends $Block {
    public $t = 'topic' as const;

    public dependencies: Tag[] = [];
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public subscription_auth: $BlockAuth[],
        public subscription_censor: $TopicCensor[],
        public input: Tag[],
        public output: $BlockOutput | undefined,
    ) {
        super(module, name, alias, auth, input, output);
    }
}