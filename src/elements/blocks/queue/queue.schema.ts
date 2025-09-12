import { Tag  } from '~/engine/dependency';
import { $Block , $BlockAuth } from '../block.schema';

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Queue extends $Block {
    public $t = 'queue' as const;

    public dependencies: Tag[] = [];
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public msgs: Tag[]
    ) {
        super(module, name, alias, auth, msgs, {})
    }
}