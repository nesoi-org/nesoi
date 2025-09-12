import { $Dependency } from '~/engine/dependency';
import { $Block, $BlockAuth, $BlockOutput } from '../block.schema';

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Topic extends $Block {
    public $t = 'topic' as const;

    public dependencies: $Dependency[] = [];
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: $Dependency[],
        public output: $BlockOutput | undefined,
    ) {
        super(module, name, alias, auth, input, output);
    }
}