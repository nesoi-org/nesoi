import { Tag } from '~/engine/dependency';
import { $Block, $BlockOutput } from '../block.schema';

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
        public authn: string[],
        public input: Tag[],
        public output: $BlockOutput | undefined,
    ) {
        super(module, name, alias, authn, input, output);
    }
}