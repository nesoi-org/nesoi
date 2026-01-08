import { $Block } from '../block.schema';

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
        public input: Tag[],
        public output: $BlockOutput | undefined,
    ) {
        super(module, name, alias, auth, input, output);
    }
}