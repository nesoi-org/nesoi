import { Tag } from '~/engine/dependency';
import { $Block } from '../block.schema';

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
        public authn: string[],
        public msgs: Tag[]
    ) {
        super(module, name, alias, authn, msgs, {})
    }
}