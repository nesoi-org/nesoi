import { $Dependency } from '~/engine/dependency';
import { $Block, $BlockAuth } from '../block.schema';

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Queue extends $Block {
    public $t = 'queue' as const;

    public dependencies: $Dependency[] = [];
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public msgs: $Dependency[]
    ) {
        super(module, name, alias, auth, msgs, {})
    }
}